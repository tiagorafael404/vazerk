const auth = firebase.auth();

// Função para login com Google.
// Esta função será chamada diretamente pelo 'onclick' no seu HTML.
function loginComGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
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
  if (user) {
    localStorage.setItem('loggedIn', 'true');
    // Exemplo: Mostra o nome do usuário em elementos com a classe 'user-name'.
    // Você precisaria ter elementos como <span class="user-name"></span> no seu HTML.
    document.querySelectorAll('.user-name').forEach(el => {
      el.innerText = user.displayName || user.email;
    });
    // Esconde botão de login e mostra botão de logout
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'block');
  } else {
    localStorage.setItem('loggedIn', 'false');
    // Mostra botão de login e esconde botão de logout
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.user-name').forEach(el => {
        el.innerText = "Visitante";
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


// Ao carregar a página, verifica o estado local e exibe instantaneamente
window.addEventListener('DOMContentLoaded', () => {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (loggedIn) {
    // Exibe logout, esconde login
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'block');
  } else {
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'none');
  }
});

// Listener global para detectar mudanças no estado de autenticação (login/logout).
auth.onAuthStateChanged((user) => {
  updateUserUI(user);
  console.log("Estado de autenticação mudou:", user ? "Logado" : "Não logado");
});

// Listener global para mudanças de auth (roda em todas as páginas)
auth.onAuthStateChanged((user) => {
  updateUserUI(user);
  console.log("Estado de auth mudou:", user ? "Logado" : "Não logado");
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
  cookieBox.classList.add("show");
  cookieBox.style.display = "block";
};

// Função para esconder a caixa de cookies
const hideCookieBox = () => {
  cookieBox.classList.remove("show");
  cookieBox.style.display = "none";
};

// Função para executar a lógica dos cookies
const executeCookiesLogic = () => {
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


document.getElementById("more").addEventListener("click", function() {
  var divmenu = document.getElementById("menu");
  
  if (divmenu.style.display === "block") {
    divmenu.style.display = "none";  // Mostrar a div
  } else {
    divmenu.style.display = "block";   // Esconder a div
  }
});

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


document.getElementById("contactme").addEventListener("click", function() {
    var divmenu = document.getElementById("contact");
  
    // Verifica se a div já está visível com a classe "show"
    if (divmenu.classList.contains("show")) {
      // Se a div estiver visível, remova a classe "show" para aplicar a animação de esconder
      divmenu.classList.remove("show");
  
      // Espera o tempo da animação e depois coloca o display de volta para "none"
      setTimeout(function() {
        divmenu.style.display = "none"; // Esconde a div após a animação
      }, 500); // Tempo de duração da animação (0.5s)
    } else {
      // Se a div não estiver visível, exibe a div e aplica a animação
      divmenu.style.display = "block"; // Torna a div visível
      setTimeout(function() {
        divmenu.classList.add("show"); // Inicia a animação de exibição (de baixo para cima)
      }, 10); // Pequeno delay para garantir que o display seja alterado antes de aplicar a animação
    }
  });

  document.getElementById("contactme-phone").addEventListener("click", function() {
    var divmenu = document.getElementById("contact");
  
    // Verifica se a div já está visível com a classe "show"
    if (divmenu.classList.contains("show")) {
      // Se a div estiver visível, remova a classe "show" para aplicar a animação de esconder
      divmenu.classList.remove("show");
  
      // Espera o tempo da animação e depois coloca o display de volta para "none"
      setTimeout(function() {
        divmenu.style.display = "none"; // Esconde a div após a animação
      }, 500); // Tempo de duração da animação (0.5s)
    } else {
      // Se a div não estiver visível, exibe a div e aplica a animação
      divmenu.style.display = "block"; // Torna a div visível
      setTimeout(function() {
        divmenu.classList.add("show"); // Inicia a animação de exibição (de baixo para cima)
      }, 10); // Pequeno delay para garantir que o display seja alterado antes de aplicar a animação
    }
  });

  document.getElementById("close").addEventListener("click", function() {
    var divmenu = document.getElementById("contact");
  
    // Verifica se a div já está visível com a classe "show"
    if (divmenu.classList.contains("show")) {
      // Se a div estiver visível, remova a classe "show" para aplicar a animação de esconder
      divmenu.classList.remove("show");
  
      // Espera o tempo da animação e depois coloca o display de volta para "none"
      setTimeout(function() {
        divmenu.style.display = "none"; // Esconde a div após a animação
      }, 500); // Tempo de duração da animação (0.5s)
    } else {
      // Se a div não estiver visível, exibe a div e aplica a animação
      divmenu.style.display = "block"; // Torna a div visível
      setTimeout(function() {
        divmenu.classList.add("show"); // Inicia a animação de exibição (de baixo para cima)
      }, 10); // Pequeno delay para garantir que o display seja alterado antes de aplicar a animação
    }
  });

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
            return;
          }

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

        function getDetailItemFromPageUrl() {
          const bodyUrl = document.body.dataset.itemUrl;
          if (bodyUrl && itemsByUrl.has(bodyUrl)) {
            return itemsByUrl.get(bodyUrl);
          }

          const path = window.location.pathname.replace(/\\/g, '/').replace(/^\/+/, '');
          for (const [itemUrl, item] of itemsByUrl) {
            const normalizedItemUrl = itemUrl.replace(/\\/g, '/').replace(/^\/+/, '');
            if (path.endsWith(normalizedItemUrl)) {
              return item;
            }
          }
          return null;
        }

        const detailItem = getDetailItemFromPageUrl();
        currentDetailItem = detailItem;

        if (detailItem) {
          const productName = document.querySelector('.product_name a');
          const productPrice = document.querySelector('.product_price a');
          const optionsTitle = document.querySelector('.options_title a');
          const buyLink = document.getElementById('buyLink');

          if (productName) {
            productName.textContent = detailItem.name || productName.textContent;
          }
          if (productPrice) {
            productPrice.textContent = detailItem.price || productPrice.textContent;
          }
          if (optionsTitle) {
            optionsTitle.textContent = detailItem.select || optionsTitle.textContent;
          }
          if (buyLink && detailItem.purchaseUrl) {
            buyLink.href = detailItem.purchaseUrl;
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
 