const cookieBox = document.querySelector(".cookies-box"),
  buttons = document.querySelectorAll(".button");

const executeCodes = () => {
  // Verifica se o cookie "codinglab" já existe
  if (document.cookie.includes("codinglab")) return;

  // Mostra a caixa de cookies
  cookieBox.classList.add("show");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Oculta a caixa de cookies
      cookieBox.classList.remove("show");

      // Verifica se o botão clicado é o de aceitar
      if (button.id === "acceptBtn") {
        // Configura o cookie com validade de 1 mês
        document.cookie = "cookieBy=codinglab; max-age=" + 60 * 60 * 24 * 30;
      }
    });
  });
};

// Chama a função quando a página carrega
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