const GOOGLE_WEB_CLIENT_ID = "862934684683-6undunvn01hnq8cqakippk3cv9rt5j18.apps.googleusercontent.com";

const auth = firebase.auth();

function isUserLoggedIn() {
  return localStorage.getItem('loggedIn') === 'true' || Boolean(auth.currentUser);
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('show'));
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 500);
}

function openAccountModal() {
  const modal = document.getElementById('account-modal');
  if (!modal) return;

  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('show'));
}

function closeAccountModal() {
  const modal = document.getElementById('account-modal');
  if (!modal) return;

  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 500);
}

function toggleAccountModal() {
  if (!isUserLoggedIn()) {
    openAuthModal();
    return;
  }

  openAccountModal();
}

// Função para login com Google.
// Esta função será chamada diretamente pelo 'onclick' no seu HTML.
function loginComGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    client_id: GOOGLE_WEB_CLIENT_ID,
    prompt: "select_account"
  });
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      console.log("Logado com Google!", user.displayName);
      alert("Bem-vindo, " + user.displayName + "!");
      // Persiste o estado de login localmente
      localStorage.setItem('loggedIn', 'true');
      // Atualiza a interface do usuário (UI) para refletir o login.
      updateUserUI(user);
    })
    .catch((error) => {
      // Não mostra nada se o usuário cancelar o popup
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Erro no Google login:", error.message);
      alert("Erro: " + error.message);
    });
}

// Função para atualizar a UI quando o estado de autenticação do usuário muda.
function updateUserUI(user) {
  const isLoggedIn = Boolean(user) || localStorage.getItem('loggedIn') === 'true';

  if (isLoggedIn) {
    localStorage.setItem('loggedIn', 'true');
    document.querySelectorAll('.user-name').forEach(el => {
      el.innerText = user?.displayName || user?.email || 'Account';
    });
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav3-label').forEach(el => {
      el.innerText = 'Account';
    });
  } else {
    localStorage.setItem('loggedIn', 'false');
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.user-name').forEach(el => {
      el.innerText = 'Visitante';
    });
    document.querySelectorAll('.nav3-label').forEach(el => {
      el.innerText = 'Sign in';
    });
  }
}
// Função para logout do Google
function logoutGoogle() {
  auth.signOut()
    .then(() => {
      console.log("Logout realizado!");
      alert("Você saiu da conta Google.");
      localStorage.setItem('loggedIn', 'false');
      updateUserUI(null);
    })
    .catch((error) => {
      console.error("Erro ao fazer logout:", error.message);
      alert("Erro: " + error.message);
    });
}


function bindAuthModalEvents() {
  document.querySelectorAll('.nav-login').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      openAuthModal();
    });
  });

  document.querySelectorAll('.nav-logout').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      toggleAccountModal();
    });
  });

  document.querySelectorAll('.nav3').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      toggleAccountModal();
    });
  });

  const closeButton = document.getElementById('auth-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeAuthModal);
  }

  const googleAuthButton = document.getElementById('google-auth-button');
  if (googleAuthButton) {
    googleAuthButton.addEventListener('click', () => {
      closeAuthModal();
      loginComGoogle();
    });
  }

  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    authModal.addEventListener('click', (event) => {
      if (event.target === authModal) {
        closeAuthModal();
      }
    });
  }

  const accountModal = document.getElementById('account-modal');
  if (accountModal) {
    accountModal.addEventListener('click', (event) => {
      if (event.target === accountModal) {
        closeAccountModal();
      }
    });
  }

  const accountCloseButton = document.getElementById('account-close');
  if (accountCloseButton) {
    accountCloseButton.addEventListener('click', closeAccountModal);
  }

  const accountLogoutButton = document.getElementById('account-logout-btn');
  if (accountLogoutButton) {
    accountLogoutButton.addEventListener('click', () => {
      closeAccountModal();
      logoutGoogle();
    });
  }

  const accountLogoutLink = document.querySelector('.account-login a');
  if (accountLogoutLink) {
    accountLogoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      closeAccountModal();
      logoutGoogle();
    });
  }
}

// Ao carregar a página, verifica o estado local e exibe instantaneamente
window.addEventListener('DOMContentLoaded', () => {
  bindAuthModalEvents();

  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (loggedIn) {
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav3-label').forEach(el => {
      el.textContent = 'Account';
    });
  } else {
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav3-label').forEach(el => {
      el.textContent = 'Sign in';
    });
  }
});

// Listener global para detectar mudanças no estado de autenticação (login/logout).
auth.onAuthStateChanged((user) => {
  updateUserUI(user);
  console.log("Estado de autenticação mudou:", user ? "Logado" : "Não logado");
});

// Seleciona elementos
const cookieBox = document.getElementById('cookiesBox');
const acceptBtn = document.getElementById('acceptBtn');
const declineBtn = document.getElementById('declineBtn');

// Função para verificar se o cookie de consentimento já foi definido
const isCookieSet = () => document.cookie.includes("cookieBy=codinglab");

// Função para verificar se o cookie de recusa já foi definido
const isCookieDeclined = () => document.cookie.includes("cookieDeclined=true");

// Função para configurar o cookie de aceitação
const setCookie = () => {
  document.cookie = "cookieBy=codinglab; max-age=" + 60 * 60 * 24 * 30 + "; path=/"; // 30 dias
};

// Função para configurar o cookie de recusa
const setDeclineCookie = () => {
  document.cookie = "cookieDeclined=true; max-age=" + 60 * 60 * 24 * 30 + "; path=/"; // 30 dias
};

// Função para exibir a caixa de cookies
const showCookieBox = () => {
  if (!cookieBox) return;
  cookieBox.classList.add("show");
  cookieBox.style.display = "block";
};

// Função para esconder a caixa de cookies
const hideCookieBox = () => {
  if (!cookieBox) return;
  cookieBox.classList.remove("show");
  cookieBox.style.display = "none";
};

// Função para executar a lógica dos cookies
const executeCookiesLogic = () => {
  if (!cookieBox || !acceptBtn || !declineBtn) return;

  // Se o cookie de consentimento ou recusa já estiver configurado, não exibe a caixa de cookies
  if (isCookieSet() || isCookieDeclined()) return;

  // Exibe a caixa de cookies
  showCookieBox();

  // Adiciona o evento para o botão "Aceitar"
  acceptBtn.addEventListener("click", () => {
    setCookie(); // Configura o cookie de aceitação
    hideCookieBox(); // Esconde a caixa de cookies
  });

  // Adiciona o evento para o botão "Recusar"
  declineBtn.addEventListener("click", () => {
    setDeclineCookie(); // Configura o cookie de recusa
    hideCookieBox(); // Esconde a caixa de cookies
  });
};

// Variável global para o item carregado na página
let currentDetailItem = null;

// Executa a lógica dos cookies
executeCookiesLogic();




document.addEventListener("DOMContentLoaded", function() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const main_photo = document.getElementById('main_photo');

  galleryItems.forEach(item => {
      item.addEventListener('click', function() {
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
          if (main_photo && newImage) {
              const normalizedImage = new URL(newImage, getItemsJsonUrl()).href;
              main_photo.style.backgroundImage = `url('${normalizedImage}')`;
          }
      });
  });
});


const moreButton = document.getElementById("more");
if (moreButton) {
  moreButton.addEventListener("click", function() {
    var divmenu = document.getElementById("menu");

    if (divmenu && divmenu.style.display === "block") {
      divmenu.style.display = "none";
    } else if (divmenu) {
      divmenu.style.display = "block";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
    const divsFodass = document.querySelectorAll(".menubutton"); // Seleciona todas as divs com a classe 'fodass'

    divsFodass.forEach(div => {
        div.addEventListener("click", function () {
            const divmenu = document.getElementById("menu");

            if (divmenu.style.display === "block") {
                divmenu.style.display = "none"; // Esconde a div
            } else {
                divmenu.style.display = "block"; // Mostra a div
            }
        });
    });
});


const contactMeButton = document.getElementById("contactme");
if (contactMeButton) {
  contactMeButton.addEventListener("click", function() {
    const divmenu = document.getElementById("contact");
    if (!divmenu) return;

    if (divmenu.classList.contains("show")) {
      divmenu.classList.remove("show");
      setTimeout(function() {
        divmenu.style.display = "none";
      }, 500);
    } else {
      divmenu.style.display = "block";
      setTimeout(function() {
        divmenu.classList.add("show");
      }, 10);
    }
  });
}

const contactMePhoneButton = document.getElementById("contactme-phone");
if (contactMePhoneButton) {
  contactMePhoneButton.addEventListener("click", function() {
    const divmenu = document.getElementById("contact");
    if (!divmenu) return;

    if (divmenu.classList.contains("show")) {
      divmenu.classList.remove("show");
      setTimeout(function() {
        divmenu.style.display = "none";
      }, 500);
    } else {
      divmenu.style.display = "block";
      setTimeout(function() {
        divmenu.classList.add("show");
      }, 10);
    }
  });
}

const closeContactButton = document.getElementById("close");
if (closeContactButton) {
  closeContactButton.addEventListener("click", function() {
    const divmenu = document.getElementById("contact");
    if (!divmenu) return;

    if (divmenu.classList.contains("show")) {
      divmenu.classList.remove("show");
      setTimeout(function() {
        divmenu.style.display = "none";
      }, 500);
    } else {
      divmenu.style.display = "block";
      setTimeout(function() {
        divmenu.classList.add("show");
      }, 10);
    }
  });
}

  function getItemsJsonUrl() {
    const documentScript = document.currentScript || document.querySelector('script[src$="script.js"]');
    if (documentScript && documentScript.src) {
      return new URL('items.json', documentScript.src).href;
    }
    return 'items.json';
  }

  function loadProductItemsFromJson() {
    const itemsUrl = getItemsJsonUrl();

    fetch(itemsUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar items.json: ' + response.status);
        }
        return response.json();
      })
      .then(items => {
        const itemsById = new Map();
        const itemsByUrl = new Map();

        items.forEach(item => {
          if (item.id !== undefined) {
            itemsById.set(String(item.id), item);
          }
          if (item.url) {
            itemsByUrl.set(item.url, item);
          }
        });

        document.querySelectorAll('.products li').forEach(li => {
          const itemId = li.dataset.itemId;
          const itemUrl = li.dataset.itemUrl;
          let item = null;

          if (itemId && itemsById.has(itemId)) {
            item = itemsById.get(itemId);
          } else if (itemUrl && itemsByUrl.has(itemUrl)) {
            item = itemsByUrl.get(itemUrl);
          }

          if (!item) {
            li.style.display = 'none';
            return;
          }

          li.style.display = '';

          const productLink = li.querySelector('.product-link');
          const nameLink = li.querySelector('.name-link');
          const priceText = li.querySelector('.price-text');
          const imageDiv = li.querySelector('.image');

          if (productLink) {
            productLink.href = item.url || itemUrl || '#';
          }
          if (nameLink) {
            nameLink.href = item.url || itemUrl || '#';
            nameLink.textContent = item.name || '';
          }
          if (priceText) {
            priceText.textContent = item.price || '';
          }
          if (imageDiv && item.image) {
            imageDiv.style.backgroundImage = `url('${item.image}')`;
          }
        });

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

        function getItemByReference(reference) {
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

        function getDetailItemFromPageUrl() {
          const bodyUrl = document.body.dataset.itemUrl;
          const bodyItem = getItemByReference(bodyUrl);
          if (bodyItem) {
            return bodyItem;
          }

          const params = new URLSearchParams(window.location.search);
          for (const key of ['item', 'url', 'product', 'id']) {
            const value = params.get(key);
            const matchedItem = getItemByReference(value);
            if (matchedItem) {
              return matchedItem;
            }
          }

          const path = window.location.pathname.replace(/\\/g, '/').replace(/^\/+/, '');
          return getItemByReference(path);
        }

        const detailItem = getDetailItemFromPageUrl();
        currentDetailItem = detailItem;

        if (!detailItem) {
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

          const main_photoElement = document.getElementById('main_photo');
          if (main_photoElement) {
            main_photoElement.style.backgroundImage = 'none';
          }
          return;
        }

        if (detailItem) {
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

              li.addEventListener('click', event => {
                event.preventDefault();
                optionsList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
              });

              if (index === 0) {
                li.classList.add('selected');
              }
            });
          }

          const main_photoElement = document.getElementById('main_photo');
          if (main_photoElement && detailItem.image) {
            const photoUrl = new URL(detailItem.image, itemsUrl).href;
            main_photoElement.style.backgroundImage = `url('${photoUrl}')`;
          }

          // Update gallery item background images from image, image2, image3
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
      })
      .catch(error => {
        console.error('Erro ao carregar items.json:', error);
      });
  }

  document.addEventListener('DOMContentLoaded', loadProductItemsFromJson);
 

