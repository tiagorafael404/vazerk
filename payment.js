// Payment page logic: creates a Stripe Checkout Session and redirects the customer.
// IMPORTANT: You must host this site over HTTPS for Stripe.

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getItemsJsonUrl() {
  const documentScript = document.currentScript || document.querySelector('script[src$="payment.js"]');
  if (documentScript && documentScript.src) {
    return new URL('items.json', documentScript.src).href;
  }
  return 'items.json';
}

function normalizeItemReference(reference) {
  if (reference === undefined || reference === null) return '';
  return String(reference)
    .trim()
    .split('#')[0]
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

function getItemByReference(itemsById, itemsByUrl, reference) {
  if (reference === undefined || reference === null) return null;
  const normalized = normalizeItemReference(reference);
  if (!normalized) return null;

  if (itemsById.has(String(normalized))) return itemsById.get(String(normalized));
  if (itemsByUrl.has(normalized)) return itemsByUrl.get(normalized);

  for (const [itemUrl, item] of itemsByUrl.entries()) {
    const normalizedItemUrl = normalizeItemReference(itemUrl);
    if (normalizedItemUrl === normalized) return item;

    const queryMatch = normalizedItemUrl.match(/(?:^|[?&])item=([^&]+)/);
    if (queryMatch && queryMatch[1] === normalized) return item;
  }

  return null;
}

async function loadItemsAndResolveDetail() {
  const itemsUrl = getItemsJsonUrl();
  const res = await fetch(itemsUrl);
  if (!res.ok) throw new Error(`Failed to load items.json: ${res.status}`);
  const items = await res.json();

  const itemsById = new Map();
  const itemsByUrl = new Map();

  items.forEach((item) => {
    if (item.id !== undefined) itemsById.set(String(item.id), item);
    if (item.url) itemsByUrl.set(item.url, item);
  });

  // Determine which item we are paying for.
  // Prefer body dataset if your HTML sets it, otherwise query params.
  let detailItem = null;

  const params = new URLSearchParams(window.location.search);
  for (const key of ['item', 'url', 'product', 'id']) {
    const value = params.get(key);
    detailItem = getItemByReference(itemsById, itemsByUrl, value);
    if (detailItem) break;
  }

  if (!detailItem) {
    const path = window.location.pathname.replace(/\\/g, '/').replace(/^\/+/, '');
    detailItem = getItemByReference(itemsById, itemsByUrl, path);
  }

  return { items, itemsUrl, detailItem };
}

function formatEuro(amount) {
  // Stripe server expects amount in cents; UI expects €
  // This assumes amount is already in euros as a decimal string like "10.99€" or "10.99".
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount).replace('€', '').trim().replace(',', '.'));
  if (Number.isFinite(n)) {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
  }
  return String(amount);
}

function parseAmountToCents(priceText) {
  const n = typeof priceText === 'number' ? priceText : parseFloat(String(priceText).replace('€', '').trim().replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error('Invalid price');
  return Math.round(n * 100);
}

function parseAmountToDecimal(priceText) {
  const n = typeof priceText === 'number' ? priceText : parseFloat(String(priceText).replace('€', '').trim().replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error('Invalid price');
  return n.toFixed(2);
}

function setImageBackground(el, src, baseUrl) {
  if (!el || !src) return;
  const url = new URL(src, baseUrl).href;
  el.style.backgroundImage = `url('${url}')`;
}

function renderOptions({ detailItem, optionsGridEl, state }) {
  optionsGridEl.innerHTML = '';

  // Your items.json uses: select: { label, options: [{id,name,url}] }
  // We treat options selection just as metadata for Stripe; prices can be extended later.
  const select = detailItem?.select;
  if (!select || !Array.isArray(select.options)) return;

  const params = new URLSearchParams(window.location.search);
  const preselectedOptionId = params.get('option');

  select.options.forEach((opt, index) => {
    const isSelected = preselectedOptionId
      ? String(opt.id) === String(preselectedOptionId)
      : index === 0;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-pill' + (isSelected ? ' selected' : '');
    btn.textContent = opt.name || `Option ${opt.id}`;
    btn.dataset.optionId = String(opt.id ?? '');

    if (isSelected) {
      state.selectedOption = opt;
      state.selectedOptionId = opt.id;
    }

    btn.addEventListener('click', () => {
      optionsGridEl.querySelectorAll('.option-pill').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedOption = opt;
      state.selectedOptionId = opt.id;
    });

    optionsGridEl.appendChild(btn);
  });
}

function getStripeServerBaseUrl() {
  const configured = window.STRIPE_SERVER_BASE_URL || window.STRIPE_BACKEND_URL;
  if (configured) return String(configured).replace(/\/$/, '');

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return 'http://127.0.0.1:3000';
  }

  return '';
}

function renderPayPalButtons({ containerEl, amountText, detailItem, serverBaseUrl, onApprove, onError }) {
  if (!containerEl || !window.paypal) {
    if (containerEl) {
      containerEl.hidden = true;
      containerEl.innerHTML = '';
    }
    return;
  }

  containerEl.hidden = false;
  containerEl.innerHTML = '';

  window.paypal.Buttons({
    funding: {
      allowed: [window.paypal.FUNDING.PAYPAL],
      disallowed: [window.paypal.FUNDING.CARD],
    },
    style: {
      shape: 'rect',
      color: 'gold',
      layout: 'vertical',
      label: 'paypal',
    },
    createOrder: async function () {
      const res = await fetch(`${serverBaseUrl.replace(/\/$/, '')}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseAmountToDecimal(amountText),
          currency: 'EUR',
          productName: detailItem?.name || 'Produto Vazerk',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar a ordem PayPal');
      }

      return data.orderId;
    },
    onApprove: async function (data) {
      const res = await fetch(`${serverBaseUrl.replace(/\/$/, '')}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.error || 'Erro ao capturar o pagamento PayPal');
      }

      onApprove?.(result, data);
    },
    onError: function (err) {
      console.error('PayPal button error', err);
      onError?.(err);
    },
  }).render(containerEl);
}

async function createCheckoutSessionAndRedirect({ payload, serverBaseUrl }) {
  const endpoint = `${serverBaseUrl.replace(/\/$/, '')}/api/checkout-session`;
  const requestBody = JSON.stringify(payload);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: text || 'Invalid server response' };
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!data.url) throw new Error('Stripe did not return session url');
  window.location.href = data.url;
}

function getFormData(paymentFormEl) {
  const fd = new FormData(paymentFormEl);
  const obj = Object.fromEntries(fd.entries());

  // Ensure types
  return {
    fullName: obj.fullName || '',
    email: obj.email || '',
    phone: obj.phone || '',
    address: obj.address || '',
    postal: obj.postal || '',
    city: obj.city || '',
    country: obj.country || '',
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const paymentFormEl = $('#paymentForm');
  const productNameEl = $('#productName');
  const productDescriptionEl = $('#productDescription');
  const productPriceEl = $('#productPrice');
  const detailTotalEl = $('#detailTotal');
  const optionsGridEl = $('#optionsGrid');
  const formErrorEl = $('#formError');
  const paypalContainerEl = $('#paypalContainer');

  // 1) Choose the Stripe backend URL.
  // For production on vazerk.com hosted at Hostinger, this must point to a publicly reachable backend URL.
  // Examples:
  // - https://api.vazerk.com
  // - https://your-node-app.hostingerapp.com
  const serverBaseUrl = getStripeServerBaseUrl();
  if (!serverBaseUrl) {
    throw new Error('Configure uma URL pública do backend Stripe para o domínio vazerk.com no Hostinger.');
  }

  // 2) Load product details
  let detail;
  try {
    const loaded = await loadItemsAndResolveDetail();
    detail = loaded.detailItem;

    if (!detail) {
      productNameEl.textContent = 'Produto não disponível';
      productDescriptionEl.textContent = 'Não foi possível carregar os detalhes.';
      productPriceEl.textContent = '—';
      detailTotalEl.textContent = '—';
      return;
    }

    // Base url for relative images (for background-image)
    const itemsUrl = loaded.itemsUrl;
    const itemsBase = new URL('.', itemsUrl).href;

    productNameEl.textContent = detail.name || 'Produto';
    productDescriptionEl.textContent = detail.description || '';
    productPriceEl.textContent = detail.price || '';
    detailTotalEl.textContent = detail.price ? formatEuro(detail.price) : '';

    // Use first available image as summary
    const productImageEl = $('#productImage');
    setImageBackground(productImageEl, detail.image || detail.image2 || detail.image3, itemsBase);

    // Options (left card)
    const state = { selectedOption: null, selectedOptionId: null };
    renderOptions({ detailItem: detail, optionsGridEl, state });

    // Track selected option inside closure via dataset
    window.__paymentState = state;

    // Attach submit listener for Stripe
    paymentFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      formErrorEl.hidden = true;

      const selectedPaymentMethodBtn = $('.payment-method.selected');
      const paymentMethod = selectedPaymentMethodBtn?.dataset?.method || 'card';

      if (paymentMethod === 'paypal') {
        formErrorEl.hidden = false;
        formErrorEl.textContent = 'Use o botão PayPal abaixo para concluir o pagamento.';
        return;
      }

      try {
        const formData = getFormData(paymentFormEl);

        // Determine base amount from item price.
        // NOTE: In your items.json prices look like "10.99€".
        // Stripe server code expects "amount" and "currency".
        const cents = parseAmountToCents(detail.price || '0');
        const amountEUR = cents; // We will pass cents and let server treat it as smallest unit.

        const payload = {
          amount: amountEUR, // cents
          currency: 'eur',
          productName: detail.name,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          postal: formData.postal,
          city: formData.city,
          country: formData.country,
          // Extra metadata
          paymentMethod,
          optionId: window.__paymentState?.selectedOptionId ?? null,
          optionName: window.__paymentState?.selectedOption?.name ?? null,
        };

        await createCheckoutSessionAndRedirect({
          payload,
          serverBaseUrl,
        });
      } catch (err) {
        console.error(err);
        formErrorEl.hidden = false;
        formErrorEl.textContent = err?.message || 'Erro ao criar pagamento';
      }
    });

    // Keep your existing payment-method UI selection
    $$('.payment-method').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.payment-method').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');

        const selectedMethod = btn.dataset.method;
        if (selectedMethod === 'paypal') {
          renderPayPalButtons({
            containerEl: paypalContainerEl,
            amountText: detail.price || '0',
            detailItem: detail,
            serverBaseUrl,
            onApprove: () => {
              window.location.href = 'success.html';
            },
            onError: (err) => {
              formErrorEl.hidden = false;
              formErrorEl.textContent = err?.message || 'Erro ao iniciar o PayPal';
            },
          });
        } else {
          if (paypalContainerEl) {
            paypalContainerEl.hidden = true;
            paypalContainerEl.innerHTML = '';
          }
        }
      });
    });

    const initialMethod = $('.payment-method.selected')?.dataset?.method || 'visa';
    if (initialMethod === 'paypal') {
      renderPayPalButtons({
        containerEl: paypalContainerEl,
        amountText: detail.price || '0',
        detailItem: detail,
        serverBaseUrl,
        onApprove: () => {
          window.location.href = 'success.html';
        },
        onError: (err) => {
          formErrorEl.hidden = false;
          formErrorEl.textContent = err?.message || 'Erro ao iniciar o PayPal';
        },
      });
    }

  } catch (err) {
    console.error(err);
    productNameEl.textContent = 'Erro ao carregar pagamento';
    formErrorEl.hidden = false;
    formErrorEl.textContent = err?.message || 'Erro';
  }
});

