let jwksCache = null;
let jwksCacheExpiry = 0;

const EUROPEAN_COUNTRIES = [
  "AL", "AD", "AT", "BE", "BA", "BG", "BY", "CH", "CY", "CZ", "DE", "DK",
  "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "LI",
  "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT",
  "RO", "RS", "SE", "SI", "SK", "SM", "UA",
];

async function getGoogleJwks() {
  const now = Date.now();
  if (jwksCache && now < jwksCacheExpiry) {
    return jwksCache;
  }

  const response = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );
  if (!response.ok) {
    throw new Error("Não foi possível carregar as chaves públicas do Firebase.");
  }

  jwksCache = await response.json();
  jwksCacheExpiry = now + 3600_000;
  return jwksCache;
}

function base64UrlToUint8Array(value) {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function base64UrlDecode(value) {
  return new TextDecoder().decode(base64UrlToUint8Array(value));
}

async function verifyFirebaseToken(idToken, projectId) {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Formato de token inválido.");
  }

  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Cabeçalho de token inválido.");
  }

  const jwks = await getGoogleJwks();
  const key = jwks.keys.find((candidate) => candidate.kid === header.kid);
  if (!key) {
    jwksCacheExpiry = 0;
    throw new Error("Chave pública do token não encontrada.");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    base64UrlToUint8Array(parts[2]),
    signedData
  );
  if (!valid) {
    throw new Error("Assinatura do token inválida.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId
    || payload.iss !== `https://securetoken.google.com/${projectId}`
    || typeof payload.sub !== "string"
    || payload.sub.length === 0
    || typeof payload.exp !== "number"
    || payload.exp <= now
    || typeof payload.iat !== "number"
    || payload.iat > now + 60) {
    throw new Error("Claims do token Firebase inválidas.");
  }

  return payload;
}

function converterPreco(priceString) {
  const cleaned = String(priceString).replace(/[^0-9,]/g, "");
  const value = Number.parseFloat(cleaned.replace(",", "."));
  if (!Number.isFinite(value)) {
    throw new Error(`Preço inválido: ${priceString}`);
  }
  return Math.round(value * 100);
}

function getSiteConfig(origin, env) {
  const sites = {
    "https://vazerk.com": {
      stripeKey: env.vazerk,
      projectId: env.FIREBASE_PROJECT_ID,
    },
    "https://rafapage.com": {
      stripeKey: env.rafapage,
      projectId: env.FIREBASE_PROJECT_ID_2,
    },
  };
  return sites[origin] || null;
}

function getCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function jsonResponse(data, status, corsHeaders) {
  return Response.json(data, { status, headers: corsHeaders });
}

async function authorizeUser(request, siteConfig) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { response: jsonResponse({ error: "Autenticação necessária." }, 401) };
  }

  if (!siteConfig.projectId) {
    return { response: jsonResponse({ error: "Projeto Firebase não configurado." }, 500) };
  }

  try {
    const user = await verifyFirebaseToken(authHeader.slice(7), siteConfig.projectId);
    return { user };
  } catch (error) {
    return {
      response: jsonResponse({ error: "Token Firebase inválido." }, 401),
    };
  }
}

async function handleCreateCheckout(request, env, origin, siteConfig, user, corsHeaders) {
  if (!siteConfig.stripeKey) {
    return jsonResponse({ error: "Chave Stripe não configurada." }, 500, corsHeaders);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "JSON inválido." }, 400, corsHeaders);
  }

  let items;
  if (Array.isArray(body.items)) {
    items = body.items;
  } else if (body.productId != null) {
    items = [{ productId: body.productId, optionId: body.optionId, quantity: 1 }];
  } else {
    return jsonResponse({ error: "Carrinho vazio." }, 400, corsHeaders);
  }

  if (items.length === 0) {
    return jsonResponse({ error: "Carrinho vazio." }, 400, corsHeaders);
  }

  const itemsResponse = await fetch(`${origin}/items.json`);
  if (!itemsResponse.ok) {
    return jsonResponse({ error: "Erro ao carregar produtos." }, 500, corsHeaders);
  }
  const catalog = await itemsResponse.json();

  const lineItems = [];
  for (const item of items) {
    const productId = item && item.productId;
    if (productId == null) {
      return jsonResponse({ error: "Produto em falta no carrinho." }, 400, corsHeaders);
    }

    const product = catalog.find((candidate) => String(candidate.id) === String(productId));
    if (!product) {
      return jsonResponse({ error: `Produto não encontrado: ${productId}` }, 404, corsHeaders);
    }

    const quantity = item.quantity != null ? Number(item.quantity) : 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return jsonResponse({
        error: `Quantidade inválida (${quantity}) para o produto ${productId}`,
      }, 400, corsHeaders);
    }

    let name = product.name;
    let unitAmount;
    const optionId = item.optionId;
    if (optionId != null) {
      const options = product.select?.options || product.options || product.opcoes || [];
      const option = options.find((candidate) => String(candidate.id) === String(optionId));
      if (!option) {
        return jsonResponse({
          error: `Opção não encontrada: ${optionId} no produto ${productId}`,
        }, 404, corsHeaders);
      }

      name = `${product.name} — ${option.name || option.nome || optionId}`;
      const optionPrice = option.price != null
        ? option.price
        : option.preco != null ? option.preco : product.price;
      unitAmount = converterPreco(optionPrice);
    } else {
      unitAmount = converterPreco(product.price);
    }

    let productUrl = `${origin}/item.html?item=${encodeURIComponent(productId)}`;
    if (optionId != null) {
      productUrl += `&option=${encodeURIComponent(optionId)}`;
    }

    lineItems.push({
      quantity: String(quantity),
      name,
      unitAmount: String(unitAmount),
      url: productUrl,
      productId: String(productId),
    });
  }

  const params = new URLSearchParams({
    mode: "payment",
    "phone_number_collection[enabled]": "true",
    billing_address_collection: "required",
    customer_creation: "always",
    success_url: `${origin}/success.html`,
    cancel_url: `${origin}/cancel.html`,
    client_reference_id: user.sub,
    "metadata[uid]": user.sub,
    "metadata[firebase_project_id]": siteConfig.projectId,
    "metadata[site_origin]": origin,
  });

  lineItems.forEach((lineItem, index) => {
    params.append(`line_items[${index}][quantity]`, lineItem.quantity);
    params.append(`line_items[${index}][price_data][currency]`, "eur");
    params.append(`line_items[${index}][price_data][unit_amount]`, lineItem.unitAmount);
    params.append(`line_items[${index}][price_data][product_data][name]`, lineItem.name);
    params.append(
      `line_items[${index}][price_data][product_data][description]`,
      lineItem.url
    );
    params.append(
      `line_items[${index}][price_data][product_data][metadata][url]`,
      lineItem.url
    );
    params.append(
      `line_items[${index}][price_data][product_data][metadata][productId]`,
      lineItem.productId
    );
  });

  EUROPEAN_COUNTRIES.forEach((country, index) => {
    params.append(`shipping_address_collection[allowed_countries][${index}]`, country);
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${siteConfig.stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await stripeResponse.json();
  if (!stripeResponse.ok || typeof session.url !== "string") {
    console.error("Erro Stripe ao criar checkout:", session);
    return jsonResponse({ error: "Não foi possível criar o checkout." }, 502, corsHeaders);
  }

  return jsonResponse({ url: session.url }, 200, corsHeaders);
}

async function handleGetOrders(env, siteConfig, user, corsHeaders) {
  if (!env.x2scale_orders) {
    return jsonResponse({ error: "Base de dados de pedidos não configurada." }, 500, corsHeaders);
  }

  try {
    const result = await env.x2scale_orders.prepare(
      `SELECT order_id, status, currency, total, items_json, created_at
       FROM orders
       WHERE uid = ?1 AND firebase_project_id = ?2
       ORDER BY created_at DESC`
    ).bind(user.sub, siteConfig.projectId).all();

    const orders = result.results.map((row) => ({
      id: row.order_id,
      status: row.status,
      currency: row.currency,
      total: row.total,
      createdAt: row.created_at,
      items: JSON.parse(row.items_json),
    }));

    return jsonResponse({ orders }, 200, corsHeaders);
  } catch (error) {
    console.error("Erro ao consultar pedidos:", error);
    return jsonResponse({ error: "Não foi possível carregar os pedidos." }, 500, corsHeaders);
  }
}

function hexToUint8Array(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!secret || !signatureHeader) {
    return false;
  }

  const values = signatureHeader.split(",").reduce((result, part) => {
    const separator = part.indexOf("=");
    if (separator > 0) {
      const key = part.slice(0, separator);
      (result[key] || (result[key] = [])).push(part.slice(separator + 1));
    }
    return result;
  }, {});
  const timestamp = Number(values.t && values.t[0]);
  if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signedPayload = new TextEncoder().encode(`${timestamp}.${payload}`);

  for (const signature of values.v1 || []) {
    const bytes = hexToUint8Array(signature);
    if (bytes && await crypto.subtle.verify("HMAC", key, bytes, signedPayload)) {
      return true;
    }
  }
  return false;
}

async function getStripeLineItems(sessionId, stripeKey) {
  const items = [];
  let startingAfter = null;

  while (true) {
    const url = new URL(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items`
    );
    url.searchParams.set("limit", "100");
    url.searchParams.append("expand[]", "data.price.product");
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.data)) {
      throw new Error("Não foi possível obter os itens do checkout no Stripe.");
    }

    data.data.forEach((lineItem) => {
      const quantity = Number(lineItem.quantity);
      const unitAmount = lineItem.price && lineItem.price.unit_amount;
      const product = lineItem.price && lineItem.price.product;
      const fallbackUnitAmount = quantity > 0
        ? Math.round(Number(lineItem.amount_subtotal) / quantity)
        : NaN;
      const amount = Number.isSafeInteger(unitAmount) ? unitAmount : fallbackUnitAmount;
      const productName = product && typeof product === "object" && product.name;
      const description = typeof lineItem.description === "string"
        && !lineItem.description.startsWith("http")
        ? lineItem.description
        : null;

      if (!Number.isInteger(quantity) || quantity < 1
        || !Number.isSafeInteger(amount) || amount < 0
        || !(typeof productName === "string" || description)) {
        throw new Error("Os itens do checkout Stripe são inválidos.");
      }

      items.push({
        name: productName || description,
        quantity,
        unitAmount: amount,
      });
    });

    if (!data.has_more || data.data.length === 0) {
      break;
    }
    startingAfter = data.data[data.data.length - 1].id;
  }

  return items;
}

async function savePaidOrder(session, env) {
  const uid = session.metadata && session.metadata.uid;
  const projectId = session.metadata && session.metadata.firebase_project_id;
  if (typeof uid !== "string" || !uid
    || typeof projectId !== "string" || !projectId
    || typeof session.id !== "string"
    || !Number.isSafeInteger(session.amount_total)
    || session.amount_total < 0
    || typeof session.currency !== "string"
    || !/^[a-z]{3}$/i.test(session.currency)) {
    throw new Error("Os dados de identificação ou pagamento do checkout são inválidos.");
  }

  const siteConfig = getSiteConfig(session.metadata.site_origin, env);
  if (!siteConfig
    || siteConfig.projectId !== projectId
    || !siteConfig.stripeKey) {
    throw new Error("O checkout não corresponde a um site configurado.");
  }

  const items = await getStripeLineItems(session.id, siteConfig.stripeKey);
  if (items.length === 0) {
    throw new Error("O checkout pago não contém itens.");
  }

  const createdAt = new Date(Number(session.created) * 1000).toISOString();
  await env.x2scale_orders.prepare(
    `INSERT INTO orders (
       order_id, uid, firebase_project_id, status, currency, total, items_json,
       payment_intent_id, created_at, updated_at
     ) VALUES (?1, ?2, ?3, 'paid', ?4, ?5, ?6, ?7, ?8, ?9)
     ON CONFLICT(order_id) DO UPDATE SET
       status = excluded.status,
       currency = excluded.currency,
       total = excluded.total,
       items_json = excluded.items_json,
       payment_intent_id = excluded.payment_intent_id,
       updated_at = excluded.updated_at
     WHERE orders.uid = excluded.uid
       AND orders.firebase_project_id = excluded.firebase_project_id`
  ).bind(
    session.id,
    uid,
    projectId,
    session.currency.toUpperCase(),
    session.amount_total,
    JSON.stringify(items),
    typeof session.payment_intent === "string" ? session.payment_intent : null,
    createdAt,
    new Date().toISOString()
  ).run();
}

async function handleStripeWebhook(request, env) {
  const signature = request.headers.get("Stripe-Signature");
  const payload = await request.text();
  if (!await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET)) {
    return Response.json({ error: "Assinatura Stripe inválida." }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return Response.json({ error: "Evento Stripe inválido." }, { status: 400 });
  }

  const sessionEvents = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ];
  if (!sessionEvents.includes(event.type)) {
    return Response.json({ received: true });
  }

  const session = event.data && event.data.object;
  if (!session || session.payment_status !== "paid") {
    return Response.json({ received: true, skipped: true });
  }

  if (!env.x2scale_orders) {
    console.error("Binding D1 x2scale_orders não configurada.");
    return Response.json({ error: "Base de dados indisponível." }, { status: 500 });
  }

  try {
    await savePaidOrder(session, env);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Erro ao guardar pedido pago:", error);
    return Response.json({ error: "Não foi possível guardar o pedido." }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/stripe-webhook") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return handleStripeWebhook(request, env);
    }

    const origin = request.headers.get("Origin");
    const isLocalOrdersRequest = url.pathname === "/orders"
      && origin === "http://localhost:5501";
    const siteConfig = getSiteConfig(origin, env)
      || (isLocalOrdersRequest ? getSiteConfig("https://vazerk.com", env) : null);
    if (!siteConfig) {
      return Response.json({ error: "Site não autorizado." }, { status: 403 });
    }

    const corsHeaders = getCorsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/orders" && request.method === "GET") {
      const authorization = await authorizeUser(request, siteConfig);
      if (authorization.response) {
        return jsonResponse(
          await authorization.response.json(),
          authorization.response.status,
          corsHeaders
        );
      }
      return handleGetOrders(env, siteConfig, authorization.user, corsHeaders);
    }

    if (url.pathname === "/" && request.method === "POST") {
      const authorization = await authorizeUser(request, siteConfig);
      if (authorization.response) {
        return jsonResponse(
          await authorization.response.json(),
          authorization.response.status,
          corsHeaders
        );
      }
      return handleCreateCheckout(
        request,
        env,
        origin,
        siteConfig,
        authorization.user,
        corsHeaders
      );
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  },
};
