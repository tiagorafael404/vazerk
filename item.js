let currentDetailItem = null;

function getItemsJsonUrl() {
  if (document.currentScript && document.currentScript.src) {
    return new URL('items.json', document.currentScript.src).href;
  }

  return '/items.json';
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

function getDetailItemFromPageUrl(itemsById, itemsByUrl) {
  const bodyUrl = document.body.dataset.itemUrl;
  const bodyItem = getItemByReference(bodyUrl, itemsById, itemsByUrl);
  if (bodyItem) {
    return bodyItem;
  }

  const params = new URLSearchParams(window.location.search);
  for (const key of ['item', 'url', 'product', 'id']) {
    const value = params.get(key);
    const matchedItem = getItemByReference(value, itemsById, itemsByUrl);
    if (matchedItem) {
      return matchedItem;
    }
  }

  const path = window.location.pathname.replace(/\\/g, '/').replace(/^\/+/, '');
  return getItemByReference(path, itemsById, itemsByUrl);
}

function renderProductsList(items) {
  const list = document.getElementById('products-list');
  if (!list) return;

  list.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.dataset.itemId = item.id;

    li.innerHTML = `
      <a class="product-link" href="${item.url}">
        <div class="image" style="background-image: url('${item.image}')"></div>
      </a>

      <div class="info">
        <div class="name">
          <a class="name-link" href="${item.url}">
            ${item.name}
          </a>
        </div>

        <div class="price">
          <a class="price-text">
            ${item.price}
          </a>
        </div>
      </div>
    `;

    list.appendChild(li);
  });
}

function renderDetailItem(detailItem, itemsUrl) {
  const productName = document.querySelector('.product_name a');
  const productPrice = document.querySelector('.product_price a');
  const productDescription = document.querySelector('.product_description a');
  const optionsTitle = document.querySelector('.options_title a');
  const optionsList = document.querySelector('.options_list ul');
  const buyLink = document.getElementById('buyLink');

  if (buyLink) {
    const itemParam = detailItem.id !== undefined ? `?item=${encodeURIComponent(detailItem.id)}` : '';
    buyLink.href = `payment.html${itemParam}`;
    buyLink.removeAttribute('target');
  }

  if (productName) {
    productName.textContent = detailItem.name || productName.textContent;
  }
  if (productPrice) {
    productPrice.textContent = detailItem.price || productPrice.textContent;
  }
  if (productDescription) {
    productDescription.textContent = detailItem.description || '';
  }
  if (optionsTitle) {
    if (typeof detailItem.select === 'string') {
      optionsTitle.textContent = detailItem.select;
    } else {
      optionsTitle.textContent = detailItem.select?.label || optionsTitle.textContent;
    }
  }

  if (optionsList && detailItem.select && Array.isArray(detailItem.select.options)) {
    optionsList.innerHTML = '';
    detailItem.select.options.forEach((option, index) => {
      const li = document.createElement('li');
      li.id = String(option.id);
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = option.name || `Option ${option.id}`;
      li.appendChild(a);
      optionsList.appendChild(li);

      li.addEventListener('click', (event) => {
        event.preventDefault();
        optionsList.querySelectorAll('li').forEach((el) => el.classList.remove('selected'));
        li.classList.add('selected');
      });

      if (index === 0) {
        li.classList.add('selected');
      }
    });
  }

  const mainPhotoElement = document.getElementById('main_photo');
  if (mainPhotoElement && detailItem.image) {
    const photoUrl = new URL(detailItem.image, itemsUrl).href;
    mainPhotoElement.style.backgroundImage = `url('${photoUrl}')`;
  }

  if (detailItem.image) {
    const photo1 = document.getElementById('photo1');
    if (photo1) {
      const photo1Url = new URL(detailItem.image, itemsUrl).href;
      photo1.style.backgroundImage = `url('${photo1Url}')`;
      photo1.setAttribute('photo', detailItem.image);
    }
  }

  if (detailItem.image2) {
    const photo2 = document.getElementById('photo2');
    if (photo2) {
      const photo2Url = new URL(detailItem.image2, itemsUrl).href;
      photo2.style.backgroundImage = `url('${photo2Url}')`;
      photo2.setAttribute('photo', detailItem.image2);
    }
  }

  if (detailItem.image3) {
    const photo3 = document.getElementById('photo3');
    if (photo3) {
      const photo3Url = new URL(detailItem.image3, itemsUrl).href;
      photo3.style.backgroundImage = `url('${photo3Url}')`;
      photo3.setAttribute('photo', detailItem.image3);
    }
  }
}

function setFallbackDetailState() {
  const productName = document.querySelector('.product_name a');
  const productPrice = document.querySelector('.product_price a');
  const optionsTitle = document.querySelector('.options_title a');

  if (productName) {
    productName.textContent = 'Product not available';
  }
  if (productPrice) {
    productPrice.textContent = '—';
  }
  if (optionsTitle) {
    optionsTitle.textContent = 'Unavailable';
  }

  const mainPhotoElement = document.getElementById('main_photo');
  if (mainPhotoElement) {
    mainPhotoElement.style.backgroundImage = 'none';
  }
}

function bindGalleryHandlers(itemsUrl) {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const mainPhoto = document.getElementById('main_photo');

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      let newImage = item.getAttribute('photo');
      if (currentDetailItem) {
        if (item.id === 'photo1' && currentDetailItem.image) {
          newImage = currentDetailItem.image;
        } else if (item.id === 'photo2' && currentDetailItem.image2) {
          newImage = currentDetailItem.image2;
        } else if (item.id === 'photo3' && currentDetailItem.image3) {
          newImage = currentDetailItem.image3;
        }
      }

      if (mainPhoto && newImage) {
        const normalizedImage = new URL(newImage, itemsUrl).href;
        mainPhoto.style.backgroundImage = `url('${normalizedImage}')`;
      }
    });
  });
}

function loadProductItemsFromJson() {
  const itemsUrl = getItemsJsonUrl();

  bindGalleryHandlers(itemsUrl);

  fetch(itemsUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Não foi possível carregar items.json: ' + response.status);
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
          itemsByUrl.set(item.url, item);
        }
      });

      renderProductsList(items);

      const detailItem = getDetailItemFromPageUrl(itemsById, itemsByUrl);
      currentDetailItem = detailItem;

      if (!detailItem) {
        setFallbackDetailState();
        return;
      }

      renderDetailItem(detailItem, itemsUrl);
    })
    .catch((error) => {
      console.error('Erro ao carregar items.json:', error);
    });
}

document.addEventListener('DOMContentLoaded', loadProductItemsFromJson);