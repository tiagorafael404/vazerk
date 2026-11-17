async function comprar(productId) {
  if (productId === undefined || productId === null || String(productId).trim() === "") {
    throw new Error("Produto invalido.");
  }

  const form = document.getElementById("paymentForm");
  if (!form) {
    throw new Error("Formulario de pagamento nao encontrado.");
  }

  const formData = new FormData(form);
  const res = await fetch("https://x2scale.tiagorgc2002.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: String(productId),
      email: formData.get("email"),
      name: formData.get("fullName"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      postal: formData.get("postal"),
      city: formData.get("city"),
      country: formData.get("country"),
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch (error) {
    throw new Error("Resposta invalida do servico de pagamento.");
  }

  if (!res.ok) {
    throw new Error(data.error || "Erro ao criar pagamento.");
  }

  if (!data || typeof data.url !== "string" || !data.url) {
    throw new Error((data && data.error) || "O servico nao retornou um link de pagamento.");
  }

  window.location.href = data.url;
}
