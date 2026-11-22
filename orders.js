(function () {
  var ordersEndpoint = "https://x2scale.tiagorgc2002.workers.dev/orders";
  var currentUser = null;
  var requestVersion = 0;
  var elements = null;

  function showState(state) {
    elements.loading.hidden = state !== "loading";
    elements.login.hidden = state !== "login";
    elements.empty.hidden = state !== "empty";
    elements.error.hidden = state !== "error";
    elements.list.hidden = state !== "orders";
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

  function createOrderCard(order) {
    if (!order || typeof order.id !== "string"
      || typeof order.status !== "string"
      || typeof order.currency !== "string"
      || !Array.isArray(order.items)) {
      throw new Error("Order data is invalid.");
    }

    var card = elements.template.content.firstElementChild.cloneNode(true);
    var orderDate = parseOrderDate(order.createdAt);
    var reference = card.querySelector(".order-reference");
    var date = card.querySelector(".order-date");
    var status = card.querySelector(".order-status");
    var itemsList = card.querySelector(".order-items");

    reference.textContent = order.paymentIntentId
      ? "Payment " + order.paymentIntentId
      : "Order " + order.id;
    date.dateTime = orderDate.toISOString();
    date.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(orderDate);
    status.textContent = order.status;

    order.items.forEach(function (item) {
      if (!item || typeof item.name !== "string"
        || !Number.isInteger(item.quantity) || item.quantity < 1
        || !Number.isSafeInteger(item.unitAmount)) {
        throw new Error("Order item data is invalid.");
      }

      var itemRow = elements.itemTemplate.content.firstElementChild.cloneNode(true);
      itemRow.querySelector(".order-item-name").textContent =
        item.name + (item.quantity > 1 ? " × " + item.quantity : "");
      itemRow.querySelector(".order-item-total").textContent =
        formatMoney(item.unitAmount * item.quantity, order.currency);
      itemsList.appendChild(itemRow);
    });

    card.querySelector(".order-total").textContent =
      formatMoney(order.total, order.currency);
    return card;
  }

  function showError(error) {
    console.error("Unable to load purchase history.", error);
    elements.errorMessage.textContent = error && error.message
      ? error.message
      : "Please try again later.";
    showState("error");
  }

  function loadOrders(user) {
    currentUser = user;
    var version = ++requestVersion;

    if (!user) {
      elements.list.replaceChildren();
      showState("login");
      return;
    }

    showState("loading");
    user.getIdToken()
      .then(function (idToken) {
        return fetch(ordersEndpoint, {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + idToken,
            "Accept": "application/json"
          }
        });
      })
      .then(function (response) {
        if (!response.ok) {
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
        return response.json();
      })
      .then(function (data) {
        if (version !== requestVersion) {
          return;
        }
        if (!data || !Array.isArray(data.orders)) {
          throw new Error("Orders service returned an invalid response.");
        }

        var sortedOrders = data.orders.slice().sort(function (a, b) {
          return parseOrderDate(b.createdAt).getTime() - parseOrderDate(a.createdAt).getTime();
        });
        var orderCards = document.createDocumentFragment();
        sortedOrders.forEach(function (order) {
          orderCards.appendChild(createOrderCard(order));
        });
        var hasOrders = sortedOrders.length > 0;
        elements.list.replaceChildren(orderCards);
        showState(hasOrders ? "orders" : "empty");
      })
      .catch(function (error) {
        if (version === requestVersion) {
          showError(error);
        }
      });
  }

  function initializeOrders() {
    elements = {
      loading: document.getElementById("orders-loading"),
      login: document.getElementById("orders-login"),
      empty: document.getElementById("orders-empty"),
      error: document.getElementById("orders-error"),
      errorMessage: document.getElementById("orders-error-message"),
      list: document.getElementById("orders-list"),
      template: document.getElementById("order-card-template"),
      itemTemplate: document.getElementById("order-item-template"),
      retry: document.getElementById("orders-retry")
    };

    elements.retry.addEventListener("click", function () {
      if (currentUser) {
        loadOrders(currentUser);
      }
    });

    var auth = window.VazerkFirebaseAuth;
    if (!auth || typeof auth.onAuthStateChanged !== "function") {
      showError(new Error("Firebase Authentication is not available."));
      return;
    }

    auth.onAuthStateChanged(loadOrders, showError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOrders);
  } else {
    initializeOrders();
  }
})();
