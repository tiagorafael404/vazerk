const GOOGLE_WEB_CLIENT_ID = "862934684683-6undunvn01hnq8cqakippk3cv9rt5j18.apps.googleusercontent.com";
const auth = typeof firebase !== 'undefined' && firebase && typeof firebase.auth === 'function' ? firebase.auth() : null;

function isUserLoggedIn() {
  return localStorage.getItem('loggedIn') === 'true' || Boolean(auth && auth.currentUser);
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

function openContactModal() {
  const modal = document.getElementById('contact');
  if (!modal) return;

  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('show'));
}

function closeContactModal() {
  const modal = document.getElementById('contact');
  if (!modal) return;

  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 500);
}

function toggleContactModal() {
  const modal = document.getElementById('contact');
  if (!modal) return;

  if (modal.classList.contains('show')) {
    closeContactModal();
    return;
  }

  openContactModal();
}

function loginComGoogle() {
  if (!auth) {
    alert('Firebase auth indisponivel.');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    client_id: GOOGLE_WEB_CLIENT_ID,
    prompt: 'select_account'
  });

  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      console.log('Logado com Google!', user.displayName);
      alert('Bem-vindo, ' + user.displayName + '!');
      localStorage.setItem('loggedIn', 'true');
      updateUserUI(user);
    })
    .catch((error) => {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }

      console.error('Erro no Google login:', error.message);
      alert('Erro: ' + error.message);
    });
}

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

function logoutGoogle() {
  if (!auth) {
    localStorage.setItem('loggedIn', 'false');
    updateUserUI(null);
    return;
  }

  auth.signOut()
    .then(() => {
      console.log('Logout realizado!');
      alert('Você saiu da conta Google.');
      localStorage.setItem('loggedIn', 'false');
      updateUserUI(null);
    })
    .catch((error) => {
      console.error('Erro ao fazer logout:', error.message);
      alert('Erro: ' + error.message);
    });
}

function injectNavbarShell() {
  if (!document.querySelector('.navbar')) {
    document.body.insertAdjacentHTML(
      'afterbegin',
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

  if (!document.querySelector('.navbar-phone')) {
    document.body.insertAdjacentHTML(
      'afterbegin',
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

  if (!document.getElementById('auth-modal')) {
    document.body.insertAdjacentHTML(
      'beforeend',
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

  if (!document.getElementById('account-modal')) {
    document.body.insertAdjacentHTML(
      'beforeend',
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

  if (!document.getElementById('contact')) {
    document.body.insertAdjacentHTML(
      'beforeend',
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

  if (!document.querySelector('.content')) {
    document.body.insertAdjacentHTML(
      'beforeend',
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
}

function bindNavbarEvents() {
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

  const moreButton = document.getElementById('more');
  if (moreButton) {
    moreButton.addEventListener('click', () => {
      const divmenu = document.getElementById('menu');
      if (!divmenu) return;

      divmenu.style.display = divmenu.style.display === 'block' ? 'none' : 'block';
    });
  }

  document.querySelectorAll('.menubutton').forEach((button) => {
    button.addEventListener('click', () => {
      const divmenu = document.getElementById('menu');
      if (divmenu) {
        divmenu.style.display = 'none';
      }
    });
  });

  const nav1 = document.querySelector('.nav1');
  const content = document.querySelector('.content');
  if (nav1 && content) {
    nav1.addEventListener('click', () => {
      content.style.display = 'block';
    });
  }

  document.querySelectorAll('#contactme, #contactme-phone').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      toggleContactModal();
    });
  });

  const authCloseButton = document.getElementById('auth-close');
  if (authCloseButton) {
    authCloseButton.addEventListener('click', closeAuthModal);
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

function syncNavbarState() {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (loggedIn) {
    document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.nav3-label').forEach(el => {
      el.textContent = 'Account';
    });
    return;
  }

  document.querySelectorAll('.nav-login').forEach(el => el.style.display = 'block');
  document.querySelectorAll('.nav-logout').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav3-label').forEach(el => {
    el.textContent = 'Sign in';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  injectNavbarShell();
  bindNavbarEvents();
  syncNavbarState();
});

if (auth) {
  auth.onAuthStateChanged((user) => {
    updateUserUI(user);
    console.log('Estado de autenticação mudou:', user ? 'Logado' : 'Não logado');
  });
}