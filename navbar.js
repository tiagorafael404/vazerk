(function () {
  if (window.__vwGolfNavbarAuthLoaded) {
    return;
  }
  window.__vwGolfNavbarAuthLoaded = true;

  var authVisualStateKey = "loggedIn";
  var firebaseAuthInstance = null;
  var currentAuthUser = null;

  function setAccountNavLabel(loggedIn) {
    document.querySelectorAll(".nav-login a, .navbar-phone .nav3 .name a").forEach(function (link) {
      link.textContent = loggedIn ? "Account" : "Sign in";
    });
  }

  function applyStoredAuthUiState() {
    var loggedIn = localStorage.getItem(authVisualStateKey) === "true";

    setAccountNavLabel(loggedIn);

    document.querySelectorAll(".nav-login").forEach(function (button) {
      button.style.display = "block";
    });

    document.querySelectorAll(".nav-logout").forEach(function (button) {
      button.style.display = "none";
    });
  }

  function toggleMobileMenuContent() {
    var divmenu = document.getElementById("menu");
    if (!divmenu) {
      return;
    }

    var contentWrapper = divmenu.closest(".content");
    var isOpen = divmenu.style.display === "block";

    if (contentWrapper) {
      contentWrapper.style.display = isOpen ? "none" : "block";
    }

    divmenu.style.display = isOpen ? "none" : "block";
  }

  function showSlidingWindow(element) {
    if (!element) {
      return;
    }

    element.style.display = "block";
    setTimeout(function () {
      element.classList.add("show");
    }, 10);
  }

  function hideSlidingWindow(element) {
    if (!element) {
      return;
    }

    element.classList.remove("show");
    setTimeout(function () {
      element.style.display = "none";
    }, 500);
  }

  function toggleSlidingWindow(element) {
    if (!element) {
      return;
    }

    if (element.classList.contains("show")) {
      hideSlidingWindow(element);
    } else {
      showSlidingWindow(element);
    }
  }

  function openExclusiveSlidingWindow(elementToOpen, elementToClose) {
    if (!elementToOpen) {
      return;
    }

    if (elementToClose && elementToClose.classList.contains("show")) {
      hideSlidingWindow(elementToClose);
      setTimeout(function () {
        showSlidingWindow(elementToOpen);
      }, 500);
      return;
    }

    toggleSlidingWindow(elementToOpen);
  }

  function isUserLoggedIn() {
    return localStorage.getItem(authVisualStateKey) === "true";
  }

  function openLoginEntryModal() {
    var accountModal = document.getElementById("account-modal");
    var contactModal = document.getElementById("contact");
    var authModal = document.getElementById("auth-modal");

    if (accountModal) {
      if (contactModal && contactModal.classList.contains("show")) {
        openExclusiveSlidingWindow(accountModal, contactModal);
        return;
      }

      if (authModal && authModal.classList.contains("show")) {
        openExclusiveSlidingWindow(accountModal, authModal);
        return;
      }

      toggleSlidingWindow(accountModal);
      return;
    }

    openExclusiveSlidingWindow(authModal, contactModal);
  }

  function openAuthModal() {
    var authModal = document.getElementById("auth-modal");
    var accountModal = document.getElementById("account-modal");
    openExclusiveSlidingWindow(authModal, accountModal);
  }

  function forceOpenAuthModal() {
    var authModal = document.getElementById("auth-modal");
    var accountModal = document.getElementById("account-modal");

    if (!authModal) {
      return;
    }

    if (accountModal) {
      hideSlidingWindow(accountModal);
    }

    if (!authModal.classList.contains("show")) {
      showSlidingWindow(authModal);
    }
  }

  function handleContactClick() {
    var contactModal = document.getElementById("contact");
    var authModal = document.getElementById("auth-modal");

    if (!isUserLoggedIn()) {
      openLoginEntryModal();
      return;
    }

    openExclusiveSlidingWindow(contactModal, authModal);
  }

  function updateAuthUi(user) {
    currentAuthUser = user || null;
    localStorage.setItem(authVisualStateKey, user ? "true" : "false");
    setAccountNavLabel(Boolean(user));

    document.querySelectorAll(".nav-login").forEach(function (button) {
      button.style.display = "block";
    });

    document.querySelectorAll(".nav-logout").forEach(function (button) {
      button.style.display = "none";
    });
  }

  function performLogout() {
    localStorage.setItem(authVisualStateKey, "false");
    updateAuthUi(null);

    if (firebaseAuthInstance) {
      firebaseAuthInstance.signOut().catch(function (error) {
        console.error("Erro ao terminar sessao:", error);
      });
    }
  }

  function hasConfiguredFirebase(config) {
    var requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];

    return requiredKeys.every(function (key) {
      return typeof (config && config[key]) === "string"
        && config[key].trim() !== ""
        && !config[key].includes("COLE_AQUI");
    });
  }

  function initializeFirebaseAuth() {
    if (window.__vwGolfAuthInitialized) {
      return;
    }

    window.__vwGolfAuthInitialized = true;

    if (!window.firebase) {
      return;
    }

    var firebaseConfig = window.VWGolfFirebaseConfig;

    if (!hasConfiguredFirebase(firebaseConfig)) {
      console.warn("Firebase nao configurado. Preencha firebase-config.js com as credenciais do seu projeto.");
      updateAuthUi(null);
      return;
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    var auth = window.firebase.auth();
    firebaseAuthInstance = auth;

    auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(function (error) {
      console.error("Erro ao definir persistencia do login:", error);
    });

    auth.onAuthStateChanged(function (user) {
      updateAuthUi(user);
    });

    var googleButton = document.getElementById("google-auth-button");
    if (googleButton && !googleButton.dataset.authBound) {
      googleButton.dataset.authBound = "true";

      var signInWithGoogle = function () {
        var provider = new window.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        auth.signInWithPopup(provider)
          .then(function (result) {
            updateAuthUi(result.user);
            hideSlidingWindow(document.getElementById("auth-modal"));
          })
          .catch(function (error) {
            if (error.code !== "auth/popup-closed-by-user") {
              console.error("Erro ao autenticar com Google:", error);
            }
          });
      };

      googleButton.addEventListener("click", signInWithGoogle);
      googleButton.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          signInWithGoogle();
        }
      });
    }

  }

  function bindNavigationHandlers() {
    var desktopMoreButton = document.getElementById("more");
    if (desktopMoreButton && !desktopMoreButton.dataset.menuBound) {
      desktopMoreButton.dataset.menuBound = "true";
      desktopMoreButton.addEventListener("click", toggleMobileMenuContent);
    }

    var phoneMoreButton = document.querySelector(".navbar-phone .more");
    if (phoneMoreButton && !phoneMoreButton.dataset.menuBound) {
      phoneMoreButton.dataset.menuBound = "true";
      phoneMoreButton.addEventListener("click", toggleMobileMenuContent);
    }

    var phoneNav1Button = document.querySelector(".navbar-phone .nav1");
    if (phoneNav1Button && !phoneNav1Button.dataset.menuBound) {
      phoneNav1Button.dataset.menuBound = "true";
      phoneNav1Button.addEventListener("click", function (event) {
        event.preventDefault();
        toggleMobileMenuContent();
      });
    }

    var phoneNav3Button = document.querySelector(".navbar-phone .nav3");
    if (phoneNav3Button && !phoneNav3Button.dataset.accountBound) {
      phoneNav3Button.dataset.accountBound = "true";
      phoneNav3Button.addEventListener("click", function (event) {
        event.preventDefault();

        var divmenu = document.getElementById("menu");
        var contentWrapper = divmenu ? divmenu.closest(".content") : document.querySelector(".content");

        if (contentWrapper) {
          contentWrapper.style.display = "block";
        }

        if (divmenu) {
          divmenu.style.display = "none";
        }

        if (!isUserLoggedIn()) {
          forceOpenAuthModal();
          return;
        }

        openLoginEntryModal();
      });
    }

    document.querySelectorAll(".menubutton").forEach(function (element) {
      if (element.dataset.menuBound) {
        return;
      }

      element.dataset.menuBound = "true";
      element.addEventListener("click", function () {
        var divmenu = document.getElementById("menu");
        var contentWrapper = divmenu ? divmenu.closest(".content") : null;

        if (!divmenu) {
          return;
        }

        if (divmenu.style.display === "block") {
          divmenu.style.display = "none";
          if (contentWrapper) {
            contentWrapper.style.display = "none";
          }
        } else {
          divmenu.style.display = "block";
          if (contentWrapper) {
            contentWrapper.style.display = "block";
          }
        }
      });
    });

    var contactButton = document.getElementById("contactme");
    if (contactButton && !contactButton.dataset.contactBound) {
      contactButton.dataset.contactBound = "true";
      contactButton.addEventListener("click", handleContactClick);
    }

    var contactPhoneButton = document.getElementById("contactme-phone");
    if (contactPhoneButton && !contactPhoneButton.dataset.contactBound) {
      contactPhoneButton.dataset.contactBound = "true";
      contactPhoneButton.addEventListener("click", handleContactClick);
    }

    var contactForm = document.querySelector(".contact-form form");
    if (contactForm && !contactForm.dataset.contactBound) {
      contactForm.dataset.contactBound = "true";
      contactForm.addEventListener("submit", function (event) {
        if (isUserLoggedIn()) {
          return;
        }

        event.preventDefault();
        openLoginEntryModal();
      });
    }

    var accountCloseButton = document.getElementById("account-close");
    if (accountCloseButton && !accountCloseButton.dataset.closeBound) {
      accountCloseButton.dataset.closeBound = "true";
      accountCloseButton.addEventListener("click", function () {
        hideSlidingWindow(document.getElementById("account-modal"));
      });
    }

    document.querySelectorAll(".account-login").forEach(function (button) {
      if (button.dataset.authBound) {
        return;
      }

      button.dataset.authBound = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        performLogout();
        hideSlidingWindow(document.getElementById("account-modal"));
      });
    });

    var contactCloseButton = document.getElementById("close");
    if (contactCloseButton && !contactCloseButton.dataset.closeBound) {
      contactCloseButton.dataset.closeBound = "true";
      contactCloseButton.addEventListener("click", function () {
        hideSlidingWindow(document.getElementById("contact"));
      });
    }

    document.querySelectorAll(".nav-login").forEach(function (button) {
      if (button.dataset.authBound) {
        return;
      }

      button.dataset.authBound = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();

        if (isUserLoggedIn()) {
          openLoginEntryModal();
          return;
        }

        openAuthModal();
      });
    });

    var authCloseButton = document.getElementById("auth-close");
    if (authCloseButton && !authCloseButton.dataset.closeBound) {
      authCloseButton.dataset.closeBound = "true";
      authCloseButton.addEventListener("click", function () {
        hideSlidingWindow(document.getElementById("auth-modal"));
      });
    }
  }

  function initializeNavigationAuth() {
    applyStoredAuthUiState();
    bindNavigationHandlers();
    initializeFirebaseAuth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavigationAuth);
  } else {
    initializeNavigationAuth();
  }
})();
