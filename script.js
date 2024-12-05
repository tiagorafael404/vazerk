const cookieBox = document.querySelector(".cookies-box"),
  buttons = document.querySelectorAll(".button");

const executeCodes = () => {
  //if cookie contains codinglab it will be returned and below of this code will not run
  // Verifica se o cookie "codinglab" já existe
  if (document.cookie.includes("codinglab")) return;
  cookieBox.classList.add("show");

  cookieBox.classList.add("show"); // Mostra a caixa de cookies

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      cookieBox.classList.remove("show");
      //if button has acceptBtn id
      if (button.id == "acceptBtn") {
        //set cookies for 1 month. 60 = 1 min, 60 = 1 hours, 24 = 1 day, 30 = 30 days
        document.cookie = "cookieBy= codinglab; max-age=" + 60 * 60 * 24 * 30;
      cookieBox.classList.remove("show"); // Oculta a caixa de cookies

      // Verifica se o botão clicado é o de aceitar
      if (button.id === "acceptBtn") {
        // Configura o cookie com validade de 1 mês
        document.cookie = "cookieBy=codinglab; max-age=" + 60 * 60 * 24 * 30;
      }
    });
  });
};
//executeCodes function will be called on webpage load

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