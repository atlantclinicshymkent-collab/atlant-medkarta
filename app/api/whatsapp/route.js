// app/api/whatsapp/route.js
// UltraMsg WhatsApp API — send text messages and PDF documents

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, message, document, filename } = body;

    const instanceId = process.env.ULTRAMSG_INSTANCE_ID || "instance165568";
    const token = process.env.ULTRAMSG_TOKEN || "bf5o7ycyndtgxue8";

    if (!to) {
      return Response.json({ error: "Missing 'to' phone number" }, { status: 400 });
    }

    const phone = formatPhone(to);

    // Send document (base64 PDF)
    if (document) {
      const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          to: phone,
          document: document,
          filename: filename || "document.pdf",
          caption: message || "",
        }),
      });
      const data = await res.json();
      if (data.error) {
        return Response.json({ error: data.error }, { status: 400 });
      }
      return Response.json({ success: true, id: data.id });
    }

    // Send text message
    if (message) {
      const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          to: phone,
          body: message,
        }),
      });
      const data = await res.json();
      if (data.error) {
        return Response.json({ error: data.error }, { status: 400 });
      }
      return Response.json({ success: true, id: data.id });
    }

    return Response.json({ error: "Missing 'message' or 'document'" }, { status: 400 });
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function formatPhone(phone) {
  let p = (phone || "").replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("8") && p.length === 11) p = "+7" + p.slice(1);
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}
