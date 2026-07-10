import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { email, subject, type, message } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Future You <onboarding@resend.dev>",
        to: email,
        subject: "We received your support request",
        html: `
          <h2>Thanks for contacting Future You!</h2>
          <p>We received your support request and will review it soon.</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Issue Type:</strong> ${type}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p>— The Future You Team</p>
        `,
      }),
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Future You <onboarding@resend.dev>",
        to: "info@jmariefinances.com",
        subject: `New Support Request: ${subject}`,
        html: `
          <h2>New Support Request</h2>
          <p><strong>User:</strong> ${email}</p>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p>${message}</p>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});