// Supabase Edge Function — send-notification
// Envia e-mail via Gmail SMTP usando senha de app do Google.
//
// Secrets necessários no Supabase (Project > Settings > Edge Functions > Secrets):
//   GMAIL_USER      — ex: condominiobellavistasbs@gmail.com
//   GMAIL_APP_PASS  — senha de app de 16 caracteres (sem espaços)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

interface Payload {
  to: string
  subject: string
  html: string
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { to, subject, html }: Payload = await req.json()

    const user = Deno.env.get('GMAIL_USER')
    const pass = Deno.env.get('GMAIL_APP_PASS')

    if (!user || !pass) {
      return new Response(JSON.stringify({ error: 'GMAIL_USER ou GMAIL_APP_PASS não configurados' }), { status: 500, headers: CORS })
    }

    const client = new SmtpClient()
    await client.connectTLS({ hostname: 'smtp.gmail.com', port: 465, username: user, password: pass })

    await client.send({
      from: `Condomínio Bella Vista <${user}>`,
      to,
      subject,
      html,
    })

    await client.close()

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
