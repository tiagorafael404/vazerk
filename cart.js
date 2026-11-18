(function () {
  var cartCollectionName = "cartItems";
  var firebaseAuth = null;
  var firestore = null;
  var currentUser = null;
  var initializationError = null;
  var authStateResolved = false;
  var resolveAuthState;
  var authStatePromise = new Promise(function (resolve) {
    resolveAuthState = resolve;
  });
  var cartElements = null;
  var productsById = new Map();
  var catalogPromise = null;
  var unsubscribeCart = null;
  var checkoutAvailable = false;
  var checkoutPending = false;
  var catalogUrl = new URL("items.json", window.location.href).href;

  function getCurrentUser() {
    return currentUser || (firebaseAuth && firebaseAuth.currentUser) || null;
  }

  function getCartCollection(user) {
    return firestore.collection("users").doc(user.uid).collection(cartCollectionName);
  }

  function getCartDocumentId(productId, optionId) {
    var encodedOptionId = optionId === null ? "none" : encodeURIComponent(optionId);
    return encodeURIComponent(productId) + "__" + encodedOptionId;
  }

  function createAuthRequiredError() {
    var error = new Error("Please sign in to continue.");
    error.code = "auth-required";
    return error;
  }

  function requireAuthenticatedUser() {
    return authStatePromise.then(function () {
      if (initializationError) {
        throw initializationError;
      }

      var user = getCurrentUser();
      if (!user) {
        throw createAuthRequiredError();
      }

      return user;
    });
  }

  function add(product, option) {
    return requireAuthenticatedUser().then(function (user) {
      if (!product || product.id === undefined || product.id === null || !product.name) {
        throw new Error("Product details are incomplete.");
      }

      var productId = String(product.id);
      var optionId = option && option.id !== undefined && option.id !== null
        ? String(option.id)
        : null;
      var itemReference = getCartCollection(user).doc(getCartDocumentId(productId, optionId));

      return firestore.runTransaction(function (transaction) {
        return transaction.get(itemReference).then(function (snapshot) {
          var quantity = 0;
          if (snapshot.exists) {
            var existingItem = snapshot.data();
            if (existingItem.productId !== productId
              || existingItem.optionId !== optionId
              || !Number.isInteger(existingItem.quantity)
              || existingItem.quantity < 1
              || existingItem.quantity >= 99) {
              throw new Error("Cart item data is invalid or has reached its quantity limit.");
            }

            quantity = existingItem.quantity;
          }

          transaction.set(itemReference, {
            productId: productId,
            optionId: optionId,
            quantity: quantity + 1,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
        });
      });
    });
  }

  function remove(productId, optionId) {
    return requireAuthenticatedUser().then(function (user) {
      return getCartCollection(user)
        .doc(getCartDocumentId(productId, optionId))
        .delete();
    });
  }

  function getProductCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch(catalogUrl)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Unable to load product data (" + response.status + ").");
          }

          return response.json();
        })
        .then(function (products) {
          if (!Array.isArray(products)) {
            throw new Error("Product data is invalid.");
          }

          productsById = new Map();
          products.forEach(function (product) {
            if (product && product.id !== undefined && product.id !== null) {
              productsById.set(String(product.id), product);
            }
          });

          return productsById;
        })
        .catch(function (error) {
          catalogPromise = null;
          throw error;
        });
    }

    return catalogPromise;
  }

  function formatPrice(priceInCents) {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR"
    }).format(priceInCents / 100);
  }

  function getPriceInCents(price) {
    var normalizedPrice = String(price || "")
      .replace(/[^\d.,]/g, "")
      .replace(",", ".");

    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice)) {
      throw new Error("Product price is invalid.");
    }

    return Math.round(Number(normalizedPrice) * 100);
  }

  function getOptionName(product, optionId) {
    if (optionId === null || !product.select || !Array.isArray(product.select.options)) {
      return "";
    }

    var option = product.select.options.find(function (item) {
      return String(item.id) === optionId;
    });

    return option ? option.name : "Option " + optionId;
  }

  function showCartError(message, error) {
    console.error(message, error);
    if (!cartElements) {
      return;
    }

    cartElements.emptyRow.hidden = true;
    cartElements.loginRequiredRow.hidden = true;
    cartElements.total.textContent = "—";
    cartElements.error.textContent = message;
    cartElements.error.hidden = false;
    checkoutAvailable = false;
    checkoutPending = false;
    cartElements.buyButton.disabled = true;
  }

  function clearCartRows() {
    cartElements.list.querySelectorAll(".cart-item").forEach(function (row) {
      row.remove();
    });
  }

  function createCartRow(cartItem, product) {
    var row = cartElements.template.content.firstElementChild.cloneNode(true);
    var cells = row.querySelectorAll('[role="cell"]');
    var image = row.querySelector(".cart-product-image");
    var name = row.querySelector(".cart-product-name");
    var removeButton = row.querySelector(".cart-remove-button");
    var displayName = product ? product.name : "Unavailable product (" + cartItem.productId + ")";
    var priceInCents = product ? getPriceInCents(product.price) : null;

    name.textContent = displayName;
    var optionName = product ? getOptionName(product, cartItem.optionId) : "";
    if (optionName) {
      name.textContent += " - " + optionName;
    }

    if (product && product.image) {
      image.src = new URL(product.image, catalogUrl).href;
      image.alt = displayName;
    } else {
      image.hidden = true;
    }

    cells[1].textContent = priceInCents === null ? "—" : formatPrice(priceInCents);
    cells[2].textContent = String(cartItem.quantity);
    cells[3].textContent = priceInCents === null
      ? "—"
      : formatPrice(priceInCents * cartItem.quantity);

    removeButton.addEventListener("click", function () {
      remove(cartItem.productId, cartItem.optionId).catch(function (error) {
        showCartError("Unable to remove this item. Please try again.", error);
      });
    });

    return {
      row: row,
      subtotalInCents: priceInCents === null ? null : priceInCents * cartItem.quantity
    };
  }

  function renderCart(items) {
    clearCartRows();
    cartElements.loginRequiredRow.hidden = true;
    cartElements.error.hidden = true;
    cartElements.emptyRow.hidden = items.length > 0;

    var totalInCents = 0;
    var totalAvailable = true;

    items.forEach(function (cartItem) {
      if (!cartItem
        || typeof cartItem.productId !== "string"
        || !cartItem.productId
        || (cartItem.optionId !== null && typeof cartItem.optionId !== "string")
        || !Number.isInteger(cartItem.quantity)
        || cartItem.quantity < 1) {
        throw new Error("Cart item data is invalid.");
      }

      var product = productsById.get(cartItem.productId) || null;
      var rendered = createCartRow(cartItem, product);
      rendered.row.classList.add("cart-item");
      cartElements.list.appendChild(rendered.row);

      if (rendered.subtotalInCents === null) {
        totalAvailable = false;
      } else {
        totalInCents += rendered.subtotalInCents;
      }
    });

    cartElements.total.textContent = totalAvailable ? formatPrice(totalInCents) : "—";
    checkoutAvailable = items.length > 0 && totalAvailable;
    cartElements.buyButton.disabled = !checkoutAvailable || checkoutPending;

    if (!totalAvailable) {
      cartElements.error.textContent = "Some products are no longer available. Remove them to update the total.";
      cartElements.error.hidden = false;
    }
  }

  function showLoginRequired() {
    clearCartRows();
    cartElements.emptyRow.hidden = true;
    cartElements.loginRequiredRow.hidden = false;
    cartElements.error.hidden = true;
    cartElements.total.textContent = "—";
    checkoutAvailable = false;
    checkoutPending = false;
    cartElements.buyButton.disabled = true;
  }

  function checkout() {
    return requireAuthenticatedUser().then(function (user) {
      if (typeof window.comprarCarrinho !== "function") {
        throw new Error("Checkout is unavailable. Please refresh the page and try again.");
      }

      return getCartCollection(user).get().then(function (snapshot) {
        var items = snapshot.docs.map(function (document) {
          return document.data();
        });

        if (items.length === 0) {
          throw new Error("Your cart is empty.");
        }

        return window.comprarCarrinho(items);
      });
    });
  }

  function handleCheckout() {
    if (!checkoutAvailable) {
      return;
    }

    cartElements.buyButton.disabled = true;
    checkoutPending = true;
    cartElements.buyButton.setAttribute("aria-busy", "true");
    cartElements.error.hidden = true;

    checkout().then(function () {
      cartElements.buyButton.removeAttribute("aria-busy");
    }, function (error) {
      console.error("Unable to start cart checkout.", error);
      cartElements.error.textContent = error.message || "Unable to start checkout. Please try again.";
      cartElements.error.hidden = false;
      checkoutPending = false;
      cartElements.buyButton.removeAttribute("aria-busy");
      cartElements.buyButton.disabled = !checkoutAvailable;
    });
  }

  function subscribeToCart(user) {
    if (unsubscribeCart) {
      unsubscribeCart();
      unsubscribeCart = null;
    }

    checkoutAvailable = false;
    checkoutPending = false;
    cartElements.buyButton.disabled = true;

    if (!user) {
      showLoginRequired();
      return;
    }

    cartElements.loginRequiredRow.hidden = true;
    getProductCatalog()
      .then(function () {
        if (!currentUser || currentUser.uid !== user.uid) {
          return;
        }

        unsubscribeCart = getCartCollection(user).onSnapshot(function (snapshot) {
          try {
            var items = snapshot.docs.map(function (document) {
              return document.data();
            });
            renderCart(items);
          } catch (error) {
            showCartError("Unable to display your cart. Please try again.", error);
          }
        }, function (error) {
          showCartError("Unable to load your cloud cart. Check that Firestore is enabled and its rules allow access.", error);
        });
      })
      .catch(function (error) {
        showCartError("Unable to load product details. Please try again.", error);
      });
  }

  function initialize() {
    cartElements = document.querySelector(".cart-table")
      ? {
        list: document.querySelector(".cart-table"),
        emptyRow: document.getElementById("cart-empty-row"),
        loginRequiredRow: document.getElementById("cart-login-required"),
        template: document.getElementById("cart-item-template"),
        total: document.getElementById("cart-total-value"),
        error: document.getElementById("cart-error"),
        buyButton: document.querySelector(".buy-button")
      }
      : null;

    if (cartElements) {
      cartElements.buyButton.addEventListener("click", handleCheckout);
    }

    firebaseAuth = window.VazerkFirebaseAuth || null;
    if (!window.firebase
      || typeof window.firebase.firestore !== "function"
      || !firebaseAuth) {
      initializationError = new Error("Firebase Auth and Firestore must be initialized before the cart.");
      authStateResolved = true;
      resolveAuthState();
      if (cartElements) {
        showCartError("Firebase is not ready. Please refresh the page and try again.", initializationError);
      }
      return;
    }

    firestore = window.firebase.firestore();
    firebaseAuth.onAuthStateChanged(function (user) {
      currentUser = user || null;
      if (!authStateResolved) {
        authStateResolved = true;
        resolveAuthState();
      }

      if (cartElements) {
        subscribeToCart(currentUser);
      }
    }, function (error) {
      initializationError = error;
      if (!authStateResolved) {
        authStateResolved = true;
        resolveAuthState();
      }
      if (cartElements) {
        showCartError("Unable to check your sign-in status. Please refresh the page.", error);
      }
    });
  }

  window.VazerkCart = {
    requireAuthenticatedUser: requireAuthenticatedUser,
    add: add,
    remove: remove
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
