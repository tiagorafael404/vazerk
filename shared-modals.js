(function () {
  var fragments = [];

  if (!document.querySelector(".navbar")) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="navbar">' +
        '<div class="mypage">' +
          '<div class="menu">' +
            '<ul>' +
              '<li><a href="/">Home</a></li>' +
              '<li id="contactme"><a href="#">Contact</a></li>' +
              '<li><a href="aboutus.html">About us</a></li>' +
            '</ul>' +
          '</div>' +
          '<div class="menu2" id="more">' +
            '<i class="material-icons" style="color:white">menu</i>' +
          '</div>' +
          '<div class="logo">' +
            '<a href="/">VW Golf</a>' +
          '</div>' +
          '<div class="more">' +
            '<div class="nav-login" onclick="openAuthModal()"><a>Sign in</a></div>' +
            '<div class="nav-logout" onclick="toggleAccountModal()" style="display:none"><a>Account</a></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  if (!document.querySelector(".navbar-phone")) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="navbar-phone">' +
        '<div class="nav1"><i class="material-icons">menu</i></div>' +
        '<div class="nav2"><a href="/">Home</a></div>' +
        '<div class="nav3">' +
          '<div class="name"><a class="nav3-label"></a></div>' +
          '<div class="pic"><a><i class="bx bx-user"></i></a></div>' +
        '</div>' +
        '<div class="nav4"><a href="cart.html"><i class="bx bx-cart"></i></a></div>' +
      '</div>'
    );
  }





  if (!document.getElementById("auth-modal")) {
    fragments.push(
      '<div class="auth-modal" id="auth-modal" style="display:none">' +
        '<div class="auth-window">' +
          '<div class="auth-header">' +
            '<div class="space"></div>' +
            '<div class="title">' +
              '<div class="title1"><i class="fa fa-user"></i></div>' +
              '<div class="title2"><a>Login or create account</a></div>' +
            '</div>' +
            '<div class="close"><i class="fa fa-close" id="auth-close"></i></div>' +
          '</div>' +
          '<div class="auth-content">' +
            '<img src="google icon.png" alt="Google" id="google-auth-button" role="button" tabindex="0">' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }



  if (!document.getElementById("cookiesBox")) {
    fragments.push(
      '<div class="cookies-box" id="cookiesBox">' +
        '<div class="cookies-title">' +
          '<i class="bx bx-cookie"></i>' +
          '<h1>Cookies (sugar free)</h1>' +
        '</div>' +
        '<div class="text">' +
          '<h2>Would you please accept some cookies?</h2><a href="cookies.html">Read more...</a>' +
        '</div>' +
        '<div class="buttons">' +
          '<button class="button" id="acceptBtn">Accept</button>' +
          '<button class="button" id="declineBtn">Decline</button>' +
        '</div>' +
      '</div>'
    );
  }

  if (!document.getElementById("account-modal")) {
    fragments.push(
      '<div class="account-modal" id="account-modal">' +
        '<div class="account-window">' +
          '<div class="account-header">' +
            '<div class="space"></div>' +
            '<div class="title">' +
              '<div class="title1"><i class="fa fa-user-circle"></i></div>' +
              '<div class="title2"><a>My account</a></div>' +
            '</div>' +
            '<div class="close"><i class="fa fa-close" id="account-close"></i></div>' +
          '</div>' +
          '<div class="account-content">' +
            '<div class="account-cart"><a href="cart.html">Cart</a></div>' +
            '<div class="account-login"><a>Logout</a></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  if (!document.getElementById("contact")) {
    fragments.push(
      '<div class="contact" id="contact">' +
        '<div class="contact-window">' +
          '<div class="contact-header">' +
            '<div class="space"></div>' +
            '<div class="title"><div class="title1"><i class="fa fa-envelope"></i></div><div class="title2"><a>Contact me</a></div></div>' +
            '<div class="close"><i class="fa fa-close" id="close"></i></div>' +
          '</div>' +
          '<div class="contact-form">' +
            '<form action="https://formsubmit.co/x2scale@gmail.com" method="POST">' +
              '<label for="name">Name</label>' +
              '<input type="name" name="name" id="name" placeholder="Name" required>' +
              '<label for="email">E-mail</label>' +
              '<input type="email" name="email" placeholder="Email Address" required>' +
              '<label for="message">Message</label>' +
              '<textarea name="message" id="message" placeholder="..." required></textarea>' +
              '<button type="submit">Send</button>' +
              '<input type="hidden" name="_captcha" value="false">' +
              '<input type="hidden" name="_next" value="https://vwgolf.net">' +
              '<input type="hidden" name="_subject" value="X2SCALE">' +
              '<input type="text" name="_honey" style="display:none">' +
              '<input type="hidden" name="_template" value="box">' +
              '<input type="hidden" name="_blacklist" value="free money, buy now, click here, discount, cheap, viagra, make money, merda, onlyfans">' +
              '<input type="hidden" name="_cc" value="x2scale@gmail.com">' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  if (!document.querySelector(".content")) {
    fragments.push(
      '<div class="content">' +
        '<div class="menu3" id="menu">' +
          '<ul>' +
            '<li><a href="/home.html" class="menubutton">Home</a></li>' +
            '<li id="contactme-phone"><a class="menubutton">Contact</a></li>' +
            '<li><a class="menubutton" href="aboutus.html">About us</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>'
    );
  }

  if (fragments.length > 0) {
    document.body.insertAdjacentHTML("beforeend", fragments.join(""));
  }
})();
