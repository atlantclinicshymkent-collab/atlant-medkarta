export async function POST(request) {
  try {
    const body = await request.json();
    const { summary, description, date, time, duration, calendarId, location } = body;

    if (!date || !time || !summary) {
      return Response.json({ error: "Missing required fields: summary, date, time" }, { status: 400 });
    }

    // Parse service account key from env
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
    } catch {
      return Response.json({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_KEY" }, { status: 500 });
    }

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      return Response.json({ error: "Google Service Account not configured" }, { status: 500 });
    }

    // Get access token via JWT
    const accessToken = await getAccessToken(serviceAccount);

    // Build event
    const startDateTime = `${date}T${time}:00`;
    const durationMin = duration || 30;
    const endDate = new Date(new Date(startDateTime).getTime() + durationMin * 60000);
    const endDateTime = endDate.toISOString().replace("Z", "");

    const event = {
      summary: summary,
      description: description || "",
      location: location || "Atlant Clinic, ул. Акпан Батыр 46, Шымкент",
      start: {
        dateTime: startDateTime,
        timeZone: "Asia/Almaty",
      },
      end: {
        dateTime: endDateTime.slice(0, 19),
        timeZone: "Asia/Almaty",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    const targetCalendar = calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Google Calendar error:", data.error);
      return Response.json({ error: data.error.message || "Calendar API error" }, { status: 400 });
    }

    return Response.json({
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// JWT-based access token generation (no external libraries needed)
async function getAccessToken(serviceAccount) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaim = base64url(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Sign with RSA-SHA256
  const privateKey = serviceAccount.private_key;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput)
  );

  const jwt = `${signatureInput}.${arrayBufferToBase64url(signature)}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(`Token error: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

function base64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .trim();
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
