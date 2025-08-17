export async function handler(event) {
  const allow = { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, ...allow };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed', ...allow };
  try {
    const { items = [] } = JSON.parse(event.body || '{}');
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return { statusCode: 500, body: 'Falta MP_ACCESS_TOKEN', ...allow };
    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(it => ({ title: it.title, quantity: it.quantity, currency_id: 'ARS', unit_price: it.unit_price })) })
    });
    const data = await resp.json();
    if (!resp.ok) return { statusCode: resp.status, body: JSON.stringify(data), ...allow };
    return { statusCode: 200, body: JSON.stringify({ id: data.id, init_point: data.init_point }), ...allow };
  } catch (e) { return { statusCode: 500, body: String(e), ...allow }; }
}