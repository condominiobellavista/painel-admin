import { supabase, isDemo } from './supabase'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: EmailOptions) {
  if (isDemo || !opts.to) return
  await supabase.functions.invoke('send-notification', { body: opts })
}

// Templates

export function emailReservaConfirmada(opts: { nome: string; apto: string; data: string; hall: string; taxa: number }) {
  const taxaStr = opts.taxa === 0 ? 'Isento' : `R$ ${opts.taxa.toFixed(2)}`
  return {
    subject: `✅ Reserva confirmada — ${opts.hall}`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">Condomínio Bella Vista</h2>
  <p>Olá, <strong>${opts.nome}</strong>!</p>
  <p>Sua reserva foi <strong style="color:#22c55e">confirmada</strong> pela administração.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Apartamento</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:bold">${opts.apto}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Local</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:bold">${opts.hall}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Data</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:bold">${opts.data}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Taxa</td><td style="padding:8px 0;font-weight:bold">${taxaStr}</td></tr>
  </table>
  <p style="color:#6b7280;font-size:13px">Em caso de dúvidas, entre em contato com a administração.</p>
</div>`,
  }
}

export function emailReservaCancelada(opts: { nome: string; apto: string; data: string; hall: string }) {
  return {
    subject: `❌ Reserva cancelada — ${opts.hall}`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">Condomínio Bella Vista</h2>
  <p>Olá, <strong>${opts.nome}</strong>!</p>
  <p>Sua reserva do <strong>${opts.hall}</strong> para o dia <strong>${opts.data}</strong> (Apto ${opts.apto}) foi <strong style="color:#ef4444">cancelada</strong>.</p>
  <p style="color:#6b7280;font-size:13px">Para reagendar ou obter mais informações, entre em contato com a administração.</p>
</div>`,
  }
}

export function emailMudancaAprovada(opts: { nome: string; apto: string; data: string; tipo: string; periodo: string }) {
  const tipoStr = opts.tipo === 'entrada' ? 'Entrada' : 'Saída'
  const periodoStr = opts.periodo === 'manha' ? 'Manhã (08h–12h)' : 'Tarde (13h–17h)'
  return {
    subject: `✅ Mudança aprovada — ${tipoStr} em ${opts.data}`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">Condomínio Bella Vista</h2>
  <p>Olá, <strong>${opts.nome}</strong>!</p>
  <p>Sua solicitação de mudança foi <strong style="color:#22c55e">aprovada</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Apartamento</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:bold">${opts.apto}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Tipo</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:bold">${tipoStr}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280">Data</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:bold">${opts.data}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Período</td><td style="padding:8px 0;font-weight:bold">${periodoStr}</td></tr>
  </table>
  <p style="color:#6b7280;font-size:13px">Em caso de dúvidas, entre em contato com a administração.</p>
</div>`,
  }
}

export function emailMudancaCancelada(opts: { nome: string; apto: string; data: string }) {
  return {
    subject: `❌ Mudança cancelada`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#6366f1">Condomínio Bella Vista</h2>
  <p>Olá, <strong>${opts.nome}</strong>!</p>
  <p>Sua solicitação de mudança para o dia <strong>${opts.data}</strong> (Apto ${opts.apto}) foi <strong style="color:#ef4444">cancelada</strong>.</p>
  <p style="color:#6b7280;font-size:13px">Para reagendar, entre em contato com a administração.</p>
</div>`,
  }
}
