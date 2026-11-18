(function () {
  var storageKey = "vazerkCart";

  function readCart() {
    var storedItems = localStorage.getItem(storageKey);
    if (!storedItems) {
      return [];
    }

    var items = JSON.parse(storedItems);
    if (!Array.isArray(items)) {
      throw new Error("Cart data is invalid.");
    }

    items.forEach(function (item) {
      if (!item
        || typeof item.productId !== "string"
        || !item.productId
        || typeof item.name !== "string"
        || typeof item.image !== "string"
        || !Number.isInteger(item.unitPriceCents)
        || item.unitPriceCents < 0
        || !Number.isInteger(item.quantity)
        || item.quantity < 1
        || (item.optionId !== null && typeof item.optionId !== "string")
        || typeof item.optionName !== "string") {
        throw new Error("Cart data is invalid.");
      }
    });

    return items;
  }

  function getPriceInCents(price) {
    var normalizedPrice = String(price || "")
      .replace(/[^\d.,]/g, "")
      .replace(",", ".");

    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice)) {
      throw new Error("This product has an invalid price.");
    }

    return Math.round(Number(normalizedPrice) * 100);
  }

  function add(product, option, imageUrl) {
    if (!product || product.id === undefined || product.id === null || !product.name || !imageUrl) {
      throw new Error("Product details are incomplete.");
    }

    var productId = String(product.id);
    var optionId = option && option.id !== undefined && option.id !== null
      ? String(option.id)
      : null;
    var optionName = option && option.name ? String(option.name) : "";
    var items = readCart();
    var existingItem = items.find(function (item) {
      return item.productId === productId && item.optionId === optionId;
    });

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      items.push({
        productId: productId,
        optionId: optionId,
        name: String(product.name),
        image: imageUrl,
        unitPriceCents: getPriceInCents(product.price),
        quantity: 1,
        optionName: optionName
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(items));
    return items;
  }

  function remove(productId, optionId) {
    var items = readCart();
    var itemIndex = items.findIndex(function (item) {
      return item.productId === productId && item.optionId === optionId;
    });

    if (itemIndex === -1) {
      throw new Error("Cart item was not found.");
    }

    items.splice(itemIndex, 1);
    localStorage.setItem(storageKey, JSON.stringify(items));
    return items;
  }

  function formatPrice(priceInCents) {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR"
    }).format(priceInCents / 100);
  }

  function createCartRow(item, template) {
    var row = template.content.firstElementChild.cloneNode(true);
    var cells = row.querySelectorAll('[role="cell"]');
    var image = row.querySelector(".cart-product-image");
    var name = row.querySelector(".cart-product-name");
    var removeButton = row.querySelector(".cart-remove-button");

    image.src = item.image;
    image.alt = item.name;
    name.textContent = item.optionName
      ? item.name + " - " + item.optionName
      : item.name;
    cells[1].textContent = formatPrice(item.unitPriceCents);
    cells[2].textContent = String(item.quantity);
    cells[3].textContent = formatPrice(item.unitPriceCents * item.quantity);
    removeButton.addEventListener("click", function () {
      try {
        remove(item.productId, item.optionId);
        renderCart();
      } catch (error) {
        console.error("Could not remove cart item.", error);
        var errorMessage = document.getElementById("cart-error");
        errorMessage.textContent = "Unable to remove this item. Please try again.";
        errorMessage.hidden = false;
      }
    });
    return row;
  }

  function renderCart() {
    var cartList = document.querySelector(".cart-table");
    if (!cartList) {
      return;
    }

    var emptyRow = document.getElementById("cart-empty-row");
    var template = document.getElementById("cart-item-template");
    var totalElement = document.getElementById("cart-total-value");
    var buyButton = document.querySelector(".buy-button");
    var errorMessage = document.getElementById("cart-error");

    try {
      var items = readCart();
      cartList.querySelectorAll(".cart-item").forEach(function (row) {
        row.remove();
      });

      items.forEach(function (item) {
        var row = createCartRow(item, template);
        row.classList.add("cart-item");
        cartList.appendChild(row);
      });

      emptyRow.hidden = items.length > 0;
      totalElement.textContent = formatPrice(items.reduce(function (total, item) {
        return total + item.unitPriceCents * item.quantity;
      }, 0));
      errorMessage.hidden = true;
      buyButton.disabled = true;
    } catch (error) {
      console.error("Could not load cart.", error);
      emptyRow.hidden = true;
      totalElement.textContent = "—";
      errorMessage.hidden = false;
      buyButton.disabled = true;
    }
  }

  window.VazerkCart = {
    add: add,
    remove: remove
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderCart);
  } else {
    renderCart();
  }
})();
