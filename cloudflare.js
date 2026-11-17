async function comprar(productId) {
  const res = await fetch("https://x2scale.tiagorgc2002.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: String(productId) }),
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert(data.error || "Erro ao criar pagamento");
  }
}
