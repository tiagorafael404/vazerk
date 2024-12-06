const cookieBox = document.querySelector(".cookies-box"),
  buttons = document.querySelectorAll(".button");

const executeCodes = () => {
  // Verifica se o cookie "cookieBy" já existe
  if (document.cookie.includes("cookieBy")) return;

  // Adiciona a classe "show" e define o estilo "display: block"
  cookieBox.classList.add("show");
  cookieBox.style.display = "block";

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove a classe "show" e define o estilo "display: none"
      cookieBox.classList.remove("show");
      cookieBox.style.display = "none";

      // Se o botão clicado for o de aceitar, configura o cookie
      if (button.id === "acceptBtn") {
        // Configura o cookie com validade de 30 dias
        document.cookie = "cookieBy=codinglab; max-age=" + 60 * 60 * 24 * 30;
      }
    });
  });
};

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

  