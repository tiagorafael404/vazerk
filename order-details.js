(function () {
  var ordersEndpoint = "https://x2scale.tiagorgc2002.workers.dev/orders";
  var catalogUrl = new URL("items.json", window.location.href).href;
  var requestedOrderId = new URLSearchParams(window.location.search).get("id");
  var currentUser = null;
  var requestVersion = 0;
  var elements = null;

  function showState(state) {
    elements.loading.hidden = state !== "loading";
    elements.login.hidden = state !== "login";
    elements.notFound.hidden = state !== "not-found";
    elements.error.hidden = state !== "error";
    elements.content.hidden = state !== "order";
  }

  function formatMoney(amountInCents, currency) {
    if (!Number.isSafeInteger(amountInCents) || amountInCents < 0) {
      throw new Error("Order amount is invalid.");
    }

    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amountInCents / 100);
  }

  function parseOrderDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Order date is invalid.");
    }
    return date;
  }

  function getProductForOrderItem(item, products) {
    if (item.productId !== null && item.productId !== undefined) {
      return products.find(function (product) {
        return String(product.id) === String(item.productId);
      }) || null;
    }

    var matchingProducts = products.filter(function (product) {
      return typeof product.name === "string"
        && (item.name === product.name || item.name.indexOf(product.name + " — ") === 0);
    });
    matchingProducts.sort(function (a, b) {
      return b.name.length - a.name.length;
    });
    return matchingProducts[0] || null;
  }

  function renderOrder(order, products) {
    if (!order || typeof order.id !== "string"
      || typeof order.currency !== "string"
      || !Array.isArray(order.items)) {
      throw new Error("Order data is invalid.");
    }

    var orderDate = parseOrderDate(order.createdAt);
    elements.date.dateTime = orderDate.toISOString();
    elements.date.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
      timeStyle: "short"
    }).format(orderDate);
    elements.paymentId.textContent = order.paymentIntentId || "Unavailable";
    elements.total.textContent = formatMoney(order.total, order.currency);
    elements.items.replaceChildren();

    order.items.forEach(function (item) {
      if (!item || typeof item.name !== "string"
        || !Number.isInteger(item.quantity) || item.quantity < 1
        || !Number.isSafeInteger(item.unitAmount)) {
        throw new Error("Order item data is invalid.");
      }

      var lineTotal = item.unitAmount * item.quantity;
      if (!Number.isSafeInteger(lineTotal)) {
        throw new Error("Order item total is invalid.");
      }

      var row = elements.itemTemplate.content.firstElementChild.cloneNode(true);
      var image = row.querySelector(".order-details-image");
      var placeholder = row.querySelector(".order-details-image-placeholder");
      var product = getProductForOrderItem(item, products);

      row.querySelector(".order-details-product-name").textContent = item.name;
      row.querySelector(".order-details-quantity").textContent =
        "Quantity: " + item.quantity;
      row.querySelector(".order-details-unit-price").textContent =
        "Unit price: " + formatMoney(item.unitAmount, order.currency);
      row.querySelector(".order-details-item-total").textContent =
        formatMoney(lineTotal, order.currency);

      if (product && typeof product.image === "string" && product.image) {
        image.src = new URL(product.image, catalogUrl).href;
        image.alt = item.name;
        image.hidden = false;
        placeholder.hidden = true;
        image.addEventListener("error", function () {
          image.hidden = true;
          placeholder.hidden = false;
        }, { once: true });
      }

      elements.items.appendChild(row);
    });

    showState("order");
  }

  function parseErrorResponse(response) {
    return response.text().then(function (body) {
      var message = "Orders service returned HTTP " + response.status + ".";
      if (body) {
        try {
          var data = JSON.parse(body);
          if (data && typeof data.error === "string") {
            message = data.error + " (HTTP " + response.status + ").";
          }
        } catch (error) {
          message += " " + body.slice(0, 200);
        }
      }
      throw new Error(message);
    });
  }

  function showError(error) {
    console.error("Unable to load order details.", error);
    elements.errorMessage.textContent = error && error.message
      ? error.message
      : "Please try again later.";
    showState("error");
  }

  function loadOrder(user) {
    currentUser = user;
    var version = ++requestVersion;

    if (!user) {
      showState("login");
      return;
    }

    if (!requestedOrderId) {
      showState("not-found");
      return;
    }

    showState("loading");
    Promise.all([
      user.getIdToken().then(function (idToken) {
        return fetch(ordersEndpoint, {
          headers: {
            "Authorization": "Bearer " + idToken,
            "Accept": "application/json"
          }
        });
      }),
      fetch(catalogUrl)
    ])
      .then(function (responses) {
        var ordersResponse = responses[0];
        var catalogResponse = responses[1];
        if (!ordersResponse.ok) {
          return parseErrorResponse(ordersResponse);
        }
        if (!catalogResponse.ok) {
          throw new Error("Unable to load product images (HTTP " + catalogResponse.status + ").");
        }
        return Promise.all([ordersResponse.json(), catalogResponse.json()]);
      })
      .then(function (results) {
        if (version !== requestVersion) {
          return;
        }
        var data = results[0];
        var products = results[1];
        if (!data || !Array.isArray(data.orders) || !Array.isArray(products)) {
          throw new Error("Order or product data is invalid.");
        }

        var order = data.orders.find(function (candidate) {
          return candidate && candidate.id === requestedOrderId;
        });
        if (!order) {
          showState("not-found");
          return;
        }

        renderOrder(order, products);
      })
      .catch(function (error) {
        if (version === requestVersion) {
          showError(error);
        }
      });
  }

  function initializeOrderDetails() {
    elements = {
      loading: document.getElementById("order-details-loading"),
      login: document.getElementById("order-details-login"),
      notFound: document.getElementById("order-details-not-found"),
      error: document.getElementById("order-details-error"),
      errorMessage: document.getElementById("order-details-error-message"),
      content: document.getElementById("order-details-content"),
      date: document.getElementById("order-details-date"),
      paymentId: document.getElementById("order-details-payment-id"),
      items: document.getElementById("order-details-items"),
      total: document.getElementById("order-details-total"),
      itemTemplate: document.getElementById("order-details-item-template"),
      retry: document.getElementById("order-details-retry")
    };

    elements.retry.addEventListener("click", function () {
      if (currentUser) {
        loadOrder(currentUser);
      }
    });

    var auth = window.VazerkFirebaseAuth;
    if (!auth || typeof auth.onAuthStateChanged !== "function") {
      showError(new Error("Firebase Authentication is not available."));
      return;
    }

    auth.onAuthStateChanged(loadOrder, showError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOrderDetails);
  } else {
    initializeOrderDetails();
  }
})();
