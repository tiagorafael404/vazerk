(function () {
  if (window.__vwGolfNavbarLoaded) {
    return;
  }
  window.__vwGolfNavbarLoaded = true;

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
      contactButton.addEventListener("click", function () {
        var contactModal = document.getElementById("contact");
        if (contactModal) {
          toggleSlidingWindow(contactModal);
        }
      });
    }

    var contactPhoneButton = document.getElementById("contactme-phone");
    if (contactPhoneButton && !contactPhoneButton.dataset.contactBound) {
      contactPhoneButton.dataset.contactBound = "true";
      contactPhoneButton.addEventListener("click", function () {
        var contactModal = document.getElementById("contact");
        if (contactModal) {
          toggleSlidingWindow(contactModal);
        }
      });
    }

    var contactCloseButton = document.getElementById("close");
    if (contactCloseButton && !contactCloseButton.dataset.closeBound) {
      contactCloseButton.dataset.closeBound = "true";
      contactCloseButton.addEventListener("click", function () {
        hideSlidingWindow(document.getElementById("contact"));
      });
    }

    document.querySelectorAll(".nav-login").forEach(function (button) {
      if (button.dataset.navLoginBound) {
        return;
      }

      button.dataset.navLoginBound = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();

        var authModal = document.getElementById("auth-modal");
        var accountModal = document.getElementById("account-modal");

        if (accountModal) {
          accountModal.classList.remove("show");
          accountModal.style.display = "none";
        }

        if (authModal) {
          authModal.style.display = "block";
          setTimeout(function () {
            authModal.classList.add("show");
          }, 10);
        }
      });
    });
  }

  function initializeNavigation() {
    bindNavigationHandlers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavigation);
  } else {
    initializeNavigation();
  }
})();
