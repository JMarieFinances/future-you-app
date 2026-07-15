import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authorization =
      request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { error: "Missing authorization." },
        401
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const resendApiKey =
      Deno.env.get("RESEND_API_KEY");

    const appUrl =
      Deno.env.get("APP_URL") ??
      "https://futureyou.app";

    const fromEmail =
      Deno.env.get("INVITE_FROM_EMAIL") ??
      "Future You <onboarding@resend.dev>";

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey ||
      !resendApiKey
    ) {
      return jsonResponse(
        {
          error:
            "The invitation email service is not configured.",
        },
        500
      );
    }

    const userClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        { error: "You must be signed in." },
        401
      );
    }

    const body = await request.json();
    const inviteId = String(
      body.inviteId ?? ""
    ).trim();

    if (!inviteId) {
      return jsonResponse(
        { error: "Invitation ID is required." },
        400
      );
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { data: invite, error: inviteError } =
      await adminClient
        .from("workspace_invites")
        .select(`
          id,
          workspace_id,
          invited_by,
          invite_email,
          role,
          status,
          workspace:shared_workspaces (
            id,
            name,
            type,
            description
          )
        `)
        .eq("id", inviteId)
        .single();

    if (inviteError || !invite) {
      return jsonResponse(
        { error: "Invitation not found." },
        404
      );
    }

    if (invite.invited_by !== user.id) {
      return jsonResponse(
        {
          error:
            "You cannot send this invitation.",
        },
        403
      );
    }

    if (invite.status !== "pending") {
      return jsonResponse(
        {
          error:
            "This invitation is no longer pending.",
        },
        400
      );
    }

    const workspace = Array.isArray(
      invite.workspace
    )
      ? invite.workspace[0]
      : invite.workspace;

    if (!workspace) {
      return jsonResponse(
        { error: "Workspace not found." },
        404
      );
    }

    const workspaceLabel =
      workspace.type === "business"
        ? "business"
        : "household";

    const roleLabel =
      invite.role.charAt(0).toUpperCase() +
      invite.role.slice(1);

    const inviterName =
      user.user_metadata?.name ??
      user.user_metadata?.full_name ??
      user.email ??
      "A Future You member";

    const invitationUrl =
      `${appUrl.replace(/\/$/, "")}/invitations`;

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [invite.invite_email],
          subject: `You were invited to ${workspace.name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111827;">
              <h1 style="margin-bottom:8px;">Join ${workspace.name}</h1>

              <p style="font-size:16px;line-height:1.6;">
                ${escapeHtml(inviterName)} invited you to collaborate
                on a shared ${workspaceLabel} budget in Future You.
              </p>

              ${
                workspace.description
                  ? `
                    <p style="font-size:15px;line-height:1.6;color:#4b5563;">
                      ${escapeHtml(workspace.description)}
                    </p>
                  `
                  : ""
              }

              <div style="margin:24px 0;padding:18px;border-radius:14px;background:#f3f4f6;">
                <p style="margin:0 0 6px;">
                  <strong>Workspace:</strong>
                  ${escapeHtml(workspace.name)}
                </p>

                <p style="margin:0;">
                  <strong>Access:</strong>
                  ${escapeHtml(roleLabel)}
                </p>
              </div>

              <a
                href="${invitationUrl}"
                style="
                  display:inline-block;
                  padding:14px 22px;
                  border-radius:12px;
                  background:#111827;
                  color:#ffffff;
                  text-decoration:none;
                  font-weight:700;
                "
              >
                Review Invitation
              </a>

              <p style="margin-top:24px;font-size:13px;line-height:1.5;color:#6b7280;">
                Sign in using ${escapeHtml(invite.invite_email)}
                to accept this invitation.
              </p>
            </div>
          `,
        }),
      }
    );

    const resendResult =
      await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        "Resend invitation error:",
        resendResult
      );

      return jsonResponse(
        {
          error:
            resendResult?.message ??
            "The invitation email could not be sent.",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      emailId: resendResult.id,
    });
  } catch (error) {
    console.error(
      "Workspace invitation error:",
      error
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send invitation.",
      },
      500
    );
  }
});

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}