(function () {
  var PRODUCT_FIELDS = {
    image: document.getElementById("productImage"),
    name: document.getElementById("productName"),
    description: document.getElementById("productDescription"),
    price: document.getElementById("productPrice"),
    total: document.getElementById("detailTotal"),
    error: document.getElementById("formError")
  };

  var UI_FIELDS = {
    form: document.getElementById("paymentForm"),
    countryInput: document.getElementById("countryInput"),
    countryList: document.getElementById("countryList"),
    payButton: document.getElementById("payButton")
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

  function normalizeOptionToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getItemFromQuery(items) {
    var params = new URLSearchParams(window.location.search);
    var itemId = params.get("item");

    if (!itemId) {
      return items && items.length ? items[0] : null;
    }

    var byId = items.find(function (item) {
      return String(item.id) === String(itemId);
    });

    if (byId) {
      return byId;
    }

    return items && items.length ? items[0] : null;
  }

  function getOptionFromQuery(item) {
    var params = new URLSearchParams(window.location.search);
    var optionValue = params.get("option");

    if (!optionValue || !item || !item.select || !Array.isArray(item.select.options)) {
      return null;
    }

    var normalizedValue = normalizeOptionToken(optionValue);

    return item.select.options.find(function (option) {
      return normalizeOptionToken(option.id) === normalizedValue
        || normalizeOptionToken(option.name) === normalizedValue
        || normalizeOptionToken(option.url || "") === normalizedValue;
    }) || null;
  }

  function buildOptionUrl(item, option) {
    if (!item || item.id === undefined) {
      return item && item.buy ? item.buy : "";
    }

    var key = option && option.id !== undefined ? String(option.id) : (option && option.name ? option.name : "default");
    return "payment.html?item=" + item.id + "&option=" + encodeURIComponent(key);
  }

  function getInitialPayUrl(item) {
    if (!item) {
      return "";
    }

    var selectedOption = getOptionFromQuery(item);
    if (selectedOption) {
      return selectedOption.url || buildOptionUrl(item, selectedOption);
    }

    if (item.select && Array.isArray(item.select.options) && item.select.options.length > 0) {
      return item.select.options[0].url || buildOptionUrl(item, item.select.options[0]) || item.buy || "";
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

  function bindPayButton() {
    if (!UI_FIELDS.payButton) {
      return;
    }

    UI_FIELDS.payButton.disabled = true;
    showError("Pagamentos indisponiveis no momento.");
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
    bindPayButton();

    loadItem().catch(function (error) {
      PRODUCT_FIELDS.name.textContent = "Produto indisponivel";
      PRODUCT_FIELDS.description.textContent = "Nao foi possivel carregar os dados deste produto.";
      PRODUCT_FIELDS.price.textContent = "-";
      PRODUCT_FIELDS.total.textContent = "-";

      if (PRODUCT_FIELDS.image) {
        PRODUCT_FIELDS.image.style.backgroundImage = "none";
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
