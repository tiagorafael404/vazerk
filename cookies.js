function ensureCookieBox() {
  if (!document.getElementById('cookiesBox')) {
    document.body.insertAdjacentHTML(
      'beforeend',
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
}

function isCookieSet() {
  return document.cookie.includes('cookieBy=codinglab');
}

function isCookieDeclined() {
  return document.cookie.includes('cookieDeclined=true');
}

function setCookie() {
  document.cookie = 'cookieBy=codinglab; max-age=' + 60 * 60 * 24 * 30 + '; path=/';
}

function setDeclineCookie() {
  document.cookie = 'cookieDeclined=true; max-age=' + 60 * 60 * 24 * 30 + '; path=/';
}

function showCookieBox() {
  const cookieBox = document.getElementById('cookiesBox');
  if (!cookieBox) return;

  cookieBox.classList.add('show');
  cookieBox.style.display = 'block';
}

function hideCookieBox() {
  const cookieBox = document.getElementById('cookiesBox');
  if (!cookieBox) return;

  cookieBox.classList.remove('show');
  cookieBox.style.display = 'none';
}

function executeCookiesLogic() {
  ensureCookieBox();

  const cookieBox = document.getElementById('cookiesBox');
  const acceptBtn = document.getElementById('acceptBtn');
  const declineBtn = document.getElementById('declineBtn');

  if (!cookieBox || !acceptBtn || !declineBtn) return;

  if (isCookieSet() || isCookieDeclined()) {
    hideCookieBox();
    return;
  }

  showCookieBox();

  acceptBtn.addEventListener('click', () => {
    setCookie();
    hideCookieBox();
  });

  declineBtn.addEventListener('click', () => {
    setDeclineCookie();
    hideCookieBox();
  });
}

document.addEventListener('DOMContentLoaded', executeCookiesLogic);