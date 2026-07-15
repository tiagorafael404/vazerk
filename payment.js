(function () {
  const params = new URLSearchParams(window.location.search);
  const itemReference = params.get('item') || params.get('id') || params.get('product') || params.get('url') || '';
  let currentItem = null;
  let paypalButtons = null;

  function normalizeItemReference(reference) {
    if (reference === undefined || reference === null) {
      return '';
    }

    return String(reference)
      .trim()
      .split('#')[0]
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
  }

  function parseAmountFromPrice(value) {
    if (typeof value === 'number') {
      return value;
    }

    if (!value) {
      return 0;
    }

    const cleaned = String(value)
      .replace(/[^0-9,.-]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(/,(?=.*,)/g, '')
      .replace(',', '.');

    const amount = parseFloat(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function getItemByReference(reference, itemsById, itemsByUrl) {
    if (reference === undefined || reference === null) {
      return null;
    }

    const normalizedReference = normalizeItemReference(reference);
    if (!normalizedReference) {
      return null;
    }

    if (itemsById.has(String(normalizedReference))) {
      return itemsById.get(String(normalizedReference));
    }

    if (itemsByUrl.has(normalizedReference)) {
      return itemsByUrl.get(normalizedReference);
    }

    for (const [itemUrl, item] of itemsByUrl.entries()) {
      const normalizedItemUrl = normalizeItemReference(itemUrl);
      if (normalizedItemUrl === normalizedReference) {
        return item;
      }

      const queryMatch = normalizedItemUrl.match(/(?:^|[?&])item=([^&]+)/);
      if (queryMatch && queryMatch[1] === normalizedReference) {
        return item;
      }
    }

    return null;
  }

  function renderItemSummary(detailItem) {
    const productName = document.getElementById('productName');
    const productDescription = document.getElementById('productDescription');
    const productPrice = document.getElementById('productPrice');
    const detailTotal = document.getElementById('detailTotal');
    const productImage = document.getElementById('productImage');
    const optionsGrid = document.getElementById('optionsGrid');
    const optionsSection = document.getElementById('optionsSection');

    if (productName) {
      productName.textContent = detailItem.name || 'Produto';
    }
    if (productDescription) {
      productDescription.textContent = detailItem.description || 'Descricao indisponivel.';
    }
    if (productPrice) {
      productPrice.textContent = detailItem.price || '-';
    }
    if (detailTotal) {
      detailTotal.textContent = detailItem.price || '-';
    }
    if (productImage && detailItem.image) {
      const photoUrl = new URL(detailItem.image, itemsUrl).href;
      productImage.style.backgroundImage = `url('${photoUrl}')`;
    }

    if (optionsSection && optionsGrid) {
      if (detailItem.select && Array.isArray(detailItem.select.options) && detailItem.select.options.length) {
        optionsSection.hidden = false;
        optionsGrid.innerHTML = '';

        detailItem.select.options.forEach((option) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'option-chip';
          button.textContent = option.name || `Opcao ${option.id}`;
          optionsGrid.appendChild(button);
        });
      } else {
        optionsSection.hidden = true;
        optionsGrid.innerHTML = '';
      }
    }
  }

  function showPayPalButtons() {
    const paypalContainer = document.getElementById('paypalContainer');
    const submitButton = document.querySelector('.submit-button');

    if (!paypalContainer || !window.paypal) {
      return;
    }

    paypalContainer.hidden = false;
    if (submitButton) {
      submitButton.hidden = true;
    }

    if (paypalButtons) {
      paypalButtons.close();
    }

    paypalButtons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
      },
      createOrder: async () => {
        const amount = parseAmountFromPrice(currentItem?.price || 0).toFixed(2);
        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'EUR',
            productName: currentItem?.name || 'Produto Vazerk',
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar o pedido PayPal');
        }

        return data.orderId;
      },
      onApprove: async (data) => {
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao capturar o pagamento');
        }

        window.location.href = '/success.html';
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        const errorBox = document.getElementById('formError');
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.textContent = 'Nao foi possivel concluir o pagamento com o PayPal.';
        }
      },
    });

    paypalButtons.render('#paypalContainer');
  }

  function attachPaymentMethodHandlers() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    const form = document.getElementById('paymentForm');
    const errorBox = document.getElementById('formError');

    paymentMethods.forEach((button) => {
      button.addEventListener('click', () => {
        paymentMethods.forEach((item) => item.classList.remove('selected'));
        button.classList.add('selected');

        if (button.dataset.method === 'paypal') {
          showPayPalButtons();
        } else {
          const paypalContainer = document.getElementById('paypalContainer');
          const submitButton = document.querySelector('.submit-button');
          if (paypalContainer) {
            paypalContainer.hidden = true;
          }
          if (submitButton) {
            submitButton.hidden = false;
          }
        }
      });
    });

    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (errorBox) {
          errorBox.hidden = true;
          errorBox.textContent = '';
        }

        const selectedMethod = document.querySelector('.payment-method.selected')?.dataset.method || 'visa';

        if (selectedMethod === 'paypal') {
          showPayPalButtons();
          return;
        }

        const formData = new FormData(form);
        const payload = {
          amount: parseAmountFromPrice(currentItem?.price || 0) * 100,
          currency: 'eur',
          productName: currentItem?.name || 'Produto Vazerk',
          email: formData.get('email') || '',
          fullName: formData.get('fullName') || '',
          phone: formData.get('phone') || '',
          address: formData.get('address') || '',
          postal: formData.get('postal') || '',
          city: formData.get('city') || '',
          country: formData.get('country') || '',
          paymentMethod: selectedMethod,
          optionName: currentItem?.select?.options?.[0]?.name || '',
        };

        try {
          const response = await fetch('/api/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Erro ao iniciar o pagamento');
          }

          if (data.url) {
            window.location.href = data.url;
          }
        } catch (err) {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = err.message || 'Erro ao iniciar o pagamento.';
          }
        }
      });
    }
  }

  const itemsUrl = new URL('items.json', window.location.href).href;

  fetch(itemsUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Nao foi possivel carregar items.json: ' + response.status);
      }
      return response.json();
    })
    .then((items) => {
      const itemsById = new Map();
      const itemsByUrl = new Map();

      items.forEach((item) => {
        if (item.id !== undefined) {
          itemsById.set(String(item.id), item);
        }
        if (item.url) {
          itemsByUrl.set(normalizeItemReference(item.url), item);
        }
      });

      const detailItem = getItemByReference(itemReference, itemsById, itemsByUrl)
        || getItemByReference(window.location.pathname.replace(/\\/g, '/').replace(/^\/+/, ''), itemsById, itemsByUrl)
        || items[0] || null;

      if (!detailItem) {
        const productName = document.getElementById('productName');
        const productDescription = document.getElementById('productDescription');
        const productPrice = document.getElementById('productPrice');
        const detailTotal = document.getElementById('detailTotal');
        const productImage = document.getElementById('productImage');

        if (productName) productName.textContent = 'Produto nao encontrado';
        if (productDescription) productDescription.textContent = 'Este item nao esta disponivel no momento.';
        if (productPrice) productPrice.textContent = '-';
        if (detailTotal) detailTotal.textContent = '-';
        if (productImage) productImage.style.backgroundImage = 'none';
        return;
      }

      currentItem = detailItem;
      renderItemSummary(detailItem);
      attachPaymentMethodHandlers();
    })
    .catch((error) => {
      console.error('Erro ao carregar o item da pagina de pagamento:', error);
    });
})();