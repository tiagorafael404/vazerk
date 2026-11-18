function getFirebaseUserForCheckout() {
  const auth = window.VazerkFirebaseAuth
    || (window.firebase && window.firebase.apps.length ? window.firebase.auth() : null);
  const user = auth && auth.currentUser;
  if (!user) {
    const error = new Error("Please sign in to continue.");
    error.code = "auth-required";
    throw error;
  }

  return user;
}

async function criarSessaoCheckout(payload) {
  const user = getFirebaseUserForCheckout();
  const idToken = await user.getIdToken();
  const res = await fetch("https://x2scale.tiagorgc2002.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch (error) {
    throw new Error("Invalid response from the payment service.");
  }

  if (!res.ok) {
    throw new Error(data.error || "Unable to create payment.");
  }

  if (!data || typeof data.url !== "string" || !data.url) {
    throw new Error((data && data.error) || "The payment service did not return a checkout link.");
  }

  return data.url;
}

async function comprar(productId, optionId) {
  if (productId === undefined || productId === null || String(productId).trim() === "") {
    throw new Error("Invalid product.");
  }

  const payload = { productId: String(productId) };
  if (optionId !== undefined && optionId !== null) {
    payload.optionId = String(optionId);
  }

  window.location.href = await criarSessaoCheckout(payload);
}

async function comprarCarrinho(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const payloadItems = items.map((item) => {
    if (!item || item.productId === undefined || item.productId === null) {
      throw new Error("Your cart contains an invalid product.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error("Your cart contains an invalid quantity.");
    }

    const payloadItem = {
      productId: String(item.productId),
      quantity: item.quantity,
    };
    if (item.optionId !== undefined && item.optionId !== null) {
      payloadItem.optionId = String(item.optionId);
    }
    return payloadItem;
  });

  window.location.href = await criarSessaoCheckout({ items: payloadItems });
}
