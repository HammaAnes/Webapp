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
    const transporter = nodemailer.createTransport({
      host: "mail.coffice.dz",
      port: 465,
      secure: true,
      auth: {
        user: "desk@coffice.dz",
        pass: "Coffice2026!",
      },
    });

    const info = await transporter.sendMail({
      from: '"Coffice" <desk@coffice.dz>',
      to: "h.m.s.aghiles@gmail.com",
      subject: "Test Coffice - Email de test",
      text: "Ceci est un email de test envoye depuis Supabase Edge Function pour verifier que le systeme d'envoi fonctionne correctement.\n\nCordialement,\nCoffice",
      html: `<html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0284c7;">Test Coffice</h2>
          <p>Ceci est un email de test envoye depuis Supabase Edge Function pour verifier que le systeme d'envoi fonctionne correctement.</p>
          <br/>
          <p>Cordialement,<br/><strong>Coffice</strong></p>
        </body>
      </html>`,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email envoye avec succes", messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
