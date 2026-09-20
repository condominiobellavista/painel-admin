// Supabase Edge Function — send-notification
// Chama a API do Resend para enviar e-mail ao solicitante quando uma
// reserva ou mudança é confirmada, cancelada ou aprovada.
//
// Variáveis necessárias no Supabase (Project > Settings > Edge Functions):
//   RESEND_API_KEY  — chave da API em resend.com (plano gratuito: 3.000 e-mails/mês)
//   FROM_EMAIL      — endereço remetente verificado no Resend (ex: noreply@bellavista.com.br)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface Payload {
  to: string
  subject: string
  html: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const { to, subject, html }: Payload = await req.json()

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('FROM_EMAIL') ?? 'Bella Vista <noreply@bellavista.com.br>'

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY não configurada' }), { status: 500 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
