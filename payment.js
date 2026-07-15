(function () {
	const params = new URLSearchParams(window.location.search);
	const requestedReference = params.get('item') || params.get('id') || params.get('product') || params.get('url') || '';
	const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	const API_BASE_CANDIDATES = [
		window.VAZERK_API_BASE_URL,
		!isLocalHost ? 'https://vazerk-stripe.fly.dev' : null,
		'',
		isLocalHost ? 'http://localhost:8080' : null,
	].filter(Boolean);

	const itemsUrl = new URL('items.json', window.location.href).href;
	let currentItem = null;
	let selectedOptionName = '';

	function getReadableErrorMessage(error, fallbackMessage) {
		if (!error) return fallbackMessage;
		if (typeof error === 'string') return error;
		if (error.message) return error.message;
		return fallbackMessage;
	}

	async function postJsonWithFallback(path, payload) {
		let lastError = null;

		for (const baseUrl of API_BASE_CANDIDATES) {
			const normalizedBase = String(baseUrl).replace(/\/$/, '');
			const url = `${normalizedBase}${path}`;

			try {
				const response = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload || {}),
				});

				const data = await response.json().catch(() => ({}));
				if (!response.ok) {
					lastError = new Error(data?.error || `Erro HTTP ${response.status}`);
					continue;
				}

				return data;
			} catch (error) {
				lastError = error;
			}
		}

		throw lastError || new Error('Nao foi possivel contactar o servidor de pagamento.');
	}

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

	function renderItemSummary(item) {
		const productName = document.getElementById('productName');
		const productDescription = document.getElementById('productDescription');
		const productPrice = document.getElementById('productPrice');
		const detailTotal = document.getElementById('detailTotal');
		const productImage = document.getElementById('productImage');
		const optionsGrid = document.getElementById('optionsGrid');
		const optionsSection = document.getElementById('optionsSection');

		if (productName) productName.textContent = item.name || 'Produto';
		if (productDescription) productDescription.textContent = item.description || 'Descricao indisponivel.';
		if (productPrice) productPrice.textContent = item.price || '-';
		if (detailTotal) detailTotal.textContent = item.price || '-';

		if (productImage) {
			if (item.image) {
				const photoUrl = new URL(item.image, itemsUrl).href;
				productImage.style.backgroundImage = `url('${photoUrl}')`;
			} else {
				productImage.style.backgroundImage = 'none';
			}
		}

		if (!optionsSection || !optionsGrid) {
			return;
		}

		if (item.select && Array.isArray(item.select.options) && item.select.options.length) {
			optionsSection.hidden = false;
			optionsGrid.innerHTML = '';

			item.select.options.forEach((option, index) => {
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'option-pill';
				button.textContent = option.name || `Opcao ${option.id}`;

				if (index === 0) {
					button.classList.add('selected');
					selectedOptionName = option.name || '';
				}

				button.addEventListener('click', () => {
					optionsGrid.querySelectorAll('.option-pill').forEach((el) => el.classList.remove('selected'));
					button.classList.add('selected');
					selectedOptionName = option.name || '';
				});

				optionsGrid.appendChild(button);
			});
		} else {
			optionsSection.hidden = true;
			optionsGrid.innerHTML = '';
			selectedOptionName = '';
		}
	}

	function bindFormSubmission() {
		const form = document.getElementById('paymentForm');
		const errorBox = document.getElementById('formError');

		if (!form) {
			return;
		}

		form.addEventListener('submit', async (event) => {
			event.preventDefault();

			if (errorBox) {
				errorBox.hidden = true;
				errorBox.textContent = '';
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
				paymentMethod: '',
				optionName: selectedOptionName || '',
			};

			try {
				const data = await postJsonWithFallback('/api/checkout-session', payload);
				if (data && data.url) {
					window.location.href = data.url;
				}
			} catch (error) {
				if (errorBox) {
					errorBox.hidden = false;
					errorBox.textContent = getReadableErrorMessage(error, 'Erro ao iniciar o pagamento.');
				}
			}
		});
	}

	function showItemNotFound() {
		const productName = document.getElementById('productName');
		const productDescription = document.getElementById('productDescription');
		const productPrice = document.getElementById('productPrice');
		const detailTotal = document.getElementById('detailTotal');
		const productImage = document.getElementById('productImage');
		const optionsSection = document.getElementById('optionsSection');

		if (productName) productName.textContent = 'Produto nao encontrado';
		if (productDescription) productDescription.textContent = 'Este item nao esta disponivel no momento.';
		if (productPrice) productPrice.textContent = '-';
		if (detailTotal) detailTotal.textContent = '-';
		if (productImage) productImage.style.backgroundImage = 'none';
		if (optionsSection) optionsSection.hidden = true;
	}

	fetch(itemsUrl)
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Nao foi possivel carregar items.json: ${response.status}`);
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

			const matchedItem = getItemByReference(requestedReference, itemsById, itemsByUrl)
				|| getItemByReference(window.location.pathname.replace(/\\/g, '/').replace(/^\/+/, ''), itemsById, itemsByUrl)
				|| items[0]
				|| null;

			currentItem = matchedItem;

			if (!matchedItem) {
				showItemNotFound();
				return;
			}

			renderItemSummary(matchedItem);
		})
		.catch((error) => {
			console.error('Erro ao carregar o item da pagina de pagamento:', error);
			showItemNotFound();
		});

	bindFormSubmission();
})();
