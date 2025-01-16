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

// Executa a lógica dos cookies
executeCookiesLogic();


// Chama a função ao carregar a página
window.addEventListener("load", executeCodes);



document.addEventListener("DOMContentLoaded", function() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const photo = document.getElementById('photo');

  galleryItems.forEach(item => {
      item.addEventListener('click', function() {
          const newImage = item.getAttribute('qual-imagem');
          photo.style.backgroundImage = `url(${newImage})`;
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

  