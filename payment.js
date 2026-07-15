(function () {
  var PRODUCT_FIELDS = {
    image: document.getElementById("productImage"),
    name: document.getElementById("productName"),
    description: document.getElementById("productDescription"),
    price: document.getElementById("productPrice"),
    total: document.getElementById("detailTotal"),
    optionsSection: document.getElementById("optionsSection"),
    optionsGrid: document.getElementById("optionsGrid"),
    error: document.getElementById("formError")
  };

  var UI_FIELDS = {
    form: document.getElementById("paymentForm"),
    countryInput: document.getElementById("countryInput"),
    countryList: document.getElementById("countryList"),
    paypalSection: document.getElementById("paypal-section"),
    cardSection: document.getElementById("card-section")
  };

  var state = {
    item: null,
    selectedOption: null,
    currentPayUrl: ""
  };

  function showError(message) {
    if (!PRODUCT_FIELDS.error) {
      return;
    }

    if (!message) {
      PRODUCT_FIELDS.error.hidden = true;
      PRODUCT_FIELDS.error.textContent = "";
      return;
    }

    PRODUCT_FIELDS.error.hidden = false;
    PRODUCT_FIELDS.error.textContent = message;
  }

  function getItemsJsonUrl() {
    var script = document.currentScript || document.querySelector('script[src$="payment.js"]');
    if (script && script.src) {
      return new URL("items.json", script.src).href;
    }

    return "items.json";
  }

  function parsePriceToNumber(priceText) {
    if (!priceText) {
      return NaN;
    }

    var cleaned = String(priceText)
      .replace(/[^\d.,]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    return Number(cleaned);
  }

  function formatEuro(priceText) {
    var numeric = parsePriceToNumber(priceText);

    if (!Number.isFinite(numeric)) {
      return priceText || "-";
    }

    return numeric.toFixed(2) + " EUR";
  }

  function getItemFromQuery(items) {
    var params = new URLSearchParams(window.location.search);
    var itemId = params.get("item");

    if (!itemId) {
      return null;
    }

    var byId = items.find(function (item) {
      return String(item.id) === String(itemId);
    });

    if (byId) {
      return byId;
    }

    return null;
  }

  function getInitialPayUrl(item) {
    if (item.select && Array.isArray(item.select.options) && item.select.options.length > 0) {
      return item.select.options[0].url || item.buy || "";
    }

    return item.buy || "";
  }

  function renderItem(item) {
    PRODUCT_FIELDS.name.textContent = item.name || "Produto";
    PRODUCT_FIELDS.description.textContent = item.description || "Sem descricao disponivel.";
    PRODUCT_FIELDS.price.textContent = formatEuro(item.price);
    PRODUCT_FIELDS.total.textContent = formatEuro(item.price);

    if (PRODUCT_FIELDS.image) {
      if (item.image) {
        PRODUCT_FIELDS.image.style.backgroundImage = "url('" + item.image + "')";
      } else {
        PRODUCT_FIELDS.image.style.backgroundImage = "none";
      }
    }

    renderOptions(item);
  }

  function setSelectedOption(option, button) {
    state.selectedOption = option || null;
    state.currentPayUrl = (option && option.url) || (state.item && state.item.buy) || "";

    if (!PRODUCT_FIELDS.optionsGrid) {
      return;
    }

    Array.prototype.slice.call(PRODUCT_FIELDS.optionsGrid.querySelectorAll(".option-pill")).forEach(function (pill) {
      pill.classList.remove("selected");
    });

    if (button) {
      button.classList.add("selected");
    }
  }

  function renderOptions(item) {
    var hasOptions = item.select && Array.isArray(item.select.options) && item.select.options.length > 0;

    if (!hasOptions) {
      if (PRODUCT_FIELDS.optionsSection) {
        PRODUCT_FIELDS.optionsSection.style.display = "none";
      }
      state.selectedOption = null;
      state.currentPayUrl = item.buy || "";
      return;
    }

    PRODUCT_FIELDS.optionsSection.style.display = "block";
    PRODUCT_FIELDS.optionsGrid.innerHTML = "";

    item.select.options.forEach(function (option, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-pill";
      btn.textContent = option.name || ("Option " + (index + 1));

      btn.addEventListener("click", function () {
        setSelectedOption(option, btn);
      });

      PRODUCT_FIELDS.optionsGrid.appendChild(btn);

      if (index === 0) {
        setSelectedOption(option, btn);
      }
    });
  }

  function createPayButton(label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "submit-button";
    button.textContent = label;

    button.addEventListener("click", function () {
      showError("");

      if (UI_FIELDS.form && !UI_FIELDS.form.checkValidity()) {
        UI_FIELDS.form.reportValidity();
        return;
      }

      if (!state.currentPayUrl) {
        showError("Nao existe URL de pagamento configurada para este produto.");
        return;
      }

      var targetUrl = new URL(state.currentPayUrl, window.location.href);
      var currentUrl = new URL(window.location.href);
      if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
        showError("Este produto ainda nao tem checkout final configurado.");
        return;
      }

      window.location.href = state.currentPayUrl;
    });

    return button;
  }

  function getCurrentAmount() {
    if (!state.item) {
      return "0.00";
    }

    var numeric = parsePriceToNumber(state.item.price);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "0.00";
    }

    return numeric.toFixed(2);
  }

  function validateCheckoutForm() {
    showError("");

    if (UI_FIELDS.form && !UI_FIELDS.form.checkValidity()) {
      UI_FIELDS.form.reportValidity();
      showError("Preencha todos os campos obrigatorios antes de pagar.");
      return false;
    }

    return true;
  }

  function renderPaypalButtons(container, fundingSource) {
    if (!container || !window.paypal || typeof window.paypal.Buttons !== "function") {
      return false;
    }

    var config = {
      onClick: function (data, actions) {
        if (!validateCheckoutForm()) {
          return actions.reject();
        }

        return actions.resolve();
      },
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                currency_code: "EUR",
                value: getCurrentAmount()
              },
              description: state.item && state.item.name ? state.item.name : "VW Golf product"
            }
          ]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function () {
          showError("");
          alert("Pagamento concluido com sucesso.");
        });
      },
      onError: function () {
        showError("Falha ao processar pagamento. Tente novamente.");
      }
    };

    if (fundingSource) {
      config.fundingSource = fundingSource;
    }

    window.paypal.Buttons(config).render(container);
    return true;
  }

  function renderPayActions() {
    var paypalContainer = document.getElementById("paypal-buttons-container");
    var cardContainer = document.getElementById("card-buttons-container");
    var paypalRendered = false;
    var cardRendered = false;

    if (paypalContainer) {
      paypalContainer.innerHTML = "";
      paypalRendered = renderPaypalButtons(paypalContainer, null);
      if (!paypalRendered) {
        paypalContainer.appendChild(createPayButton("Pagar agora"));
      }
    }

    if (cardContainer) {
      cardContainer.innerHTML = "";
      if (window.paypal && window.paypal.FUNDING) {
        cardRendered = renderPaypalButtons(cardContainer, window.paypal.FUNDING.CARD);
      }
      if (!cardRendered) {
        cardContainer.appendChild(createPayButton("Pagar com cartao"));
      }
    }
  }



  function setupCountryPicker() {
    if (!UI_FIELDS.countryInput || !UI_FIELDS.countryList) {
      return;
    }

    var countries = [
      "Portugal",
      "Spain",
      "France",
      "Germany",
      "Italy",
      "Netherlands",
      "Belgium",
      "United Kingdom",
      "Ireland",
      "United States",
      "Brazil"
    ];

    function renderCountryList(filter) {
      var normalizedFilter = (filter || "").trim().toLowerCase();
      var matches = countries.filter(function (country) {
        return country.toLowerCase().indexOf(normalizedFilter) !== -1;
      });

      UI_FIELDS.countryList.innerHTML = "";

      if (matches.length === 0) {
        UI_FIELDS.countryList.classList.remove("show");
        return;
      }

      matches.forEach(function (country) {
        var option = document.createElement("button");
        option.type = "button";
        option.className = "country-option";
        option.textContent = country;

        option.addEventListener("click", function () {
          UI_FIELDS.countryInput.value = country;
          UI_FIELDS.countryList.classList.remove("show");
        });

        UI_FIELDS.countryList.appendChild(option);
      });

      UI_FIELDS.countryList.classList.add("show");
    }

    UI_FIELDS.countryInput.addEventListener("focus", function () {
      renderCountryList(UI_FIELDS.countryInput.value);
    });

    UI_FIELDS.countryInput.addEventListener("input", function () {
      renderCountryList(UI_FIELDS.countryInput.value);
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".country-picker")) {
        UI_FIELDS.countryList.classList.remove("show");
      }
    });
  }

  function loadItem() {
    return fetch(getItemsJsonUrl())
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Nao foi possivel carregar items.json");
        }

        return response.json();
      })
      .then(function (items) {
        var item = getItemFromQuery(items);

        if (!item) {
          throw new Error("Produto nao encontrado para este link.");
        }

        state.item = item;
        state.currentPayUrl = getInitialPayUrl(item);
        renderItem(item);
      });
  }

  function init() {
    setupCountryPicker();
    renderPayActions();

    loadItem().catch(function (error) {
      PRODUCT_FIELDS.name.textContent = "Produto indisponivel";
      PRODUCT_FIELDS.description.textContent = "Nao foi possivel carregar os dados deste produto.";
      PRODUCT_FIELDS.price.textContent = "-";
      PRODUCT_FIELDS.total.textContent = "-";
      if (PRODUCT_FIELDS.image) {
        PRODUCT_FIELDS.image.style.backgroundImage = "none";
      }
      if (PRODUCT_FIELDS.optionsSection) {
        PRODUCT_FIELDS.optionsSection.style.display = "none";
      }

      showError(error.message || "Falha ao carregar produto.");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
