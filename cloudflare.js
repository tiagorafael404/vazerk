async function comprar(productId, optionId) {
  if (productId === undefined || productId === null || String(productId).trim() === "") {
    throw new Error("Produto invalido.");
  }

  const payload = { productId: String(productId) };
  if (optionId !== undefined && optionId !== null) {
    payload.optionId = String(optionId);
  }

  const res = await fetch("https://x2scale.tiagorgc2002.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
