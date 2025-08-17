export async function handler(event) {
  const allow = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, ...allow };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed', ...allow };
  try {
    const { items = [], metadata = {} } = JSON.parse(event.body || '{}');
    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: 'Items requeridos', ...allow };
    }
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return { statusCode: 500, body: 'Falta MP_ACCESS_TOKEN', ...allow };
    }
    const prefBody = {
      items: items.map(it => ({
        title: String(it.title).slice(0, 250),
        quantity: Number(it.quantity)||1,
        currency_id: 'ARS',
        unit_price: Number(it.unit_price)||0
      })),
      metadata,
      shipments: { mode: 'not_specified' },
      back_urls: {
        success: 'https://tu-dominio.netlify.app/?pago=ok',
        failure: 'https://tu-dominio.netlify.app/?pago=error',
        pending: 'https://tu-dominio.netlify.app/?pago=pending'
      },
      auto_return: 'approved'
    };
    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(prefBody)
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify(data), ...allow };
    }
    return { statusCode: 200, body: JSON.stringify({ id: data.id, init_point: data.init_point }), ...allow };
  } catch (err) {
    return { statusCode: 500, body: String(err), ...allow };
  }
}