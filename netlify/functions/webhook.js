// /.netlify/functions/webhook
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    console.log("MP Webhook:", JSON.stringify(body));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("Webhook error", e);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }
}
