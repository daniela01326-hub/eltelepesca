// /.netlify/functions/create_preference
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: "MP_ACCESS_TOKEN no está configurado" }) };
    }

    const payload = JSON.parse(event.body || "{}");
    const { items = [], buyer = {}, site_url = "", order_id } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan items del carrito" }) };
    }

    const mpItems = items.map((it) => ({
      title: String(it.nombre || "Producto"),
      quantity: Number(it.cant || 1),
      currency_id: "ARS",
      unit_price: Number(it.precio_mp || it.precio_transfer || 0),
    }));

    const inferredOrigin = (event.headers["x-forwarded-proto"] && event.headers["host"])
      ? `${event.headers["x-forwarded-proto"]}://${event.headers["host"]}`
      : "";
    const baseUrl = site_url || inferredOrigin;

    const preference = {
      items: mpItems,
      payer: {
        name: buyer.name || "",
        phone: { number: buyer.phone || "" },
      },
      payment_methods: {
        installments: 1,
        excluded_payment_types: [{ id: "ticket" }]
      },
      shipments: { mode: "not_specified" },

      notification_url: `${baseUrl}/.netlify/functions/webhook`,
      external_reference: order_id || `pedido_${Date.now()}`,

      back_urls: baseUrl ? {
        success: `${baseUrl}/?mp_status=approved`,
        failure: `${baseUrl}/?mp_status=failure`,
        pending: `${baseUrl}/?mp_status=pending`
      } : undefined,
      auto_return: "approved"
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: "Error MP", details: errTxt }) };
    }

    const data = await resp.json();
    const { init_point, sandbox_init_point, id } = data;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ id, init_point, sandbox_init_point })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
}
