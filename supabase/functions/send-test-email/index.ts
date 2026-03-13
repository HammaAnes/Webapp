import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetEmail = smtpUser;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.to) targetEmail = body.to;
      } catch {
        // use default
      }
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"Coffice" <${smtpUser}>`,
      to: targetEmail,
      subject: "Test Coffice - Email de test",
      text: "Ceci est un email de test envoy\u00e9 depuis Supabase Edge Function pour v\u00e9rifier que le syst\u00e8me d'envoi fonctionne correctement.\n\nCordialement,\nCoffice",
      html: `<html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0284c7;">Test Coffice</h2>
          <p>Ceci est un email de test envoy\u00e9 depuis Supabase Edge Function pour v\u00e9rifier que le syst\u00e8me d'envoi fonctionne correctement.</p>
          <br/>
          <p>Cordialement,<br/><strong>Coffice</strong></p>
        </body>
      </html>`,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email envoy\u00e9 avec succ\u00e8s", messageId: info.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
