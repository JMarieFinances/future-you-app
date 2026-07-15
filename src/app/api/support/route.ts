import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error: "RESEND_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body = await request.json();

    const email = String(body.email ?? "").trim();
    const type = String(body.type ?? "general").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!email || !subject || !message) {
      return Response.json(
        {
          error: "Email, subject, and message are required.",
        },
        {
          status: 400,
        }
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: "Future You <onboarding@resend.dev>",
      to: "support@futureyou.app",
      subject: `New Support Request: ${subject}`,
      html: `
        <h2>New Support Request</h2>

        <p><strong>User:</strong> ${email}</p>
        <p><strong>Issue Type:</strong> ${type}</p>
        <p><strong>Subject:</strong> ${subject}</p>

        <hr />

        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    return Response.json(
      {
        success: true,
        data: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Support email error:", error);

    return Response.json(
      {
        error: "Unable to send the support request.",
      },
      {
        status: 500,
      }
    );
  }
}