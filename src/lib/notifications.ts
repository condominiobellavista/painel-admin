import { supabase, isDemo } from './supabase'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'condominiobellavistasbs@gmail.com'

export async function sendEmail(opts: EmailOptions) {
  console.log('[sendEmail] isDemo:', isDemo, 'to:', opts.to)
  if (isDemo || !opts.to) { console.warn('[sendEmail] abortando — isDemo ou sem destinatário'); return }
  const { data, error } = await supabase.functions.invoke('send-notification', { body: opts })
  console.log('[sendEmail] resultado:', { data, error })
}

const BASE = `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <div style="border-bottom:2px solid #6366f1;padding-bottom:12px;margin-bottom:20px">
    <h2 style="margin:0;color:#6366f1;font-size:18px">Condomínio Edifício Bella Vista</h2>
    <p style="margin:4px 0 0;color:#9ca3af;font-size:12px">São Bento do Sul / SC</p>
  </div>`
const FOOTER = `<p style="color:#9ca3af;font-size:12px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:12px">
  Este é um e-mail automático. Em caso de dúvidas, entre em contato com a administração.</p></div>`

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;width:40%">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:700">${value}</td>
  </tr>`
}

/* ── Admin → Morador ─────────────────────────── */

export function emailReservaConfirmada(opts: { nome: string; apto: string; data: string; hall: string; taxa: number }) {
  const taxa = opts.taxa === 0 ? 'Isento' : `R$ ${opts.taxa.toFixed(2)}`
  return {
    subject: `✅ Reserva confirmada — ${opts.hall}`,
    html: `${BASE}
      <p>Olá, <strong>${opts.nome}</strong>!</p>
      <p>Sua reserva foi <strong style="color:#22c55e">confirmada</strong> pela administração.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${row('Apartamento', opts.apto)}
        ${row('Local', opts.hall)}
        ${row('Data', opts.data)}
        ${row('Taxa', taxa)}
      </table>${FOOTER}`,
  }
}

export function emailReservaCancelada(opts: { nome: string; apto: string; data: string; hall: string }) {
  return {
    subject: `❌ Reserva cancelada — ${opts.hall}`,
    html: `${BASE}
      <p>Olá, <strong>${opts.nome}</strong>!</p>
      <p>Sua reserva do <strong>${opts.hall}</strong> para <strong>${opts.data}</strong> (Apto ${opts.apto}) foi <strong style="color:#ef4444">cancelada</strong> pela administração.</p>
      ${FOOTER}`,
  }
}

export function emailIsencaoDeferida(opts: { nome: string; apto: string; data: string; hall: string }) {
  return {
    subject: `✅ Isenção de taxa aprovada — ${opts.hall}`,
    html: `${BASE}
      <p>Olá, <strong>${opts.nome}</strong>!</p>
      <p>Sua solicitação de <strong style="color:#22c55e">isenção de taxa</strong> foi aprovada para a reserva abaixo.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${row('Apartamento', opts.apto)}
        ${row('Local', opts.hall)}
        ${row('Data', opts.data)}
        ${row('Taxa', 'Isento')}
      </table>${FOOTER}`,
  }
}

export function emailIsencaoNegada(opts: { nome: string; apto: string; data: string; hall: string; taxa: number }) {
  return {
    subject: `ℹ️ Isenção de taxa não aprovada — ${opts.hall}`,
    html: `${BASE}
      <p>Olá, <strong>${opts.nome}</strong>!</p>
      <p>Sua solicitação de isenção de taxa para a reserva abaixo <strong style="color:#ef4444">não foi aprovada</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${row('Apartamento', opts.apto)}
        ${row('Local', opts.hall)}
        ${row('Data', opts.data)}
        ${row('Taxa cobrada', `R$ ${opts.taxa.toFixed(2)}`)}
      </table>
      <p style="color:#6b7280;font-size:13px">A reserva continua ativa. A taxa será lançada no boleto do condomínio.</p>
      ${FOOTER}`,
  }
}

export function emailMudancaAprovada(opts: { nome: string; apto: string; data: string; tipo: string; periodo: string }) {
  const tipoStr = opts.tipo === 'entrada' ? 'Entrada' : 'Saída'
  const periodoStr = opts.periodo === 'manha' ? 'Manhã (08h–12h)' : 'Tarde (13h–17h)'
  return {
    subject: `✅ Mudança aprovada — ${tipoStr} em ${opts.data}`,
    html: `${BASE}
      <p>Olá, <strong>${opts.nome}</strong>!</p>
      <p>Sua solicitação de mudança foi <strong style="color:#22c55e">aprovada</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${row('Apartamento', opts.apto)}
        ${row('Tipo', tipoStr)}
        ${row('Data', opts.data)}
        ${row('Período', periodoStr)}
      </table>${FOOTER}`,
  }
}

export function emailMudancaCancelada(opts: { nome: string; apto: string; data: string }) {
  return {
    subject: `❌ Mudança cancelada`,
    html: `${BASE}
      <p>Olá, <strong>${opts.nome}</strong>!</p>
      <p>Sua solicitação de mudança para <strong>${opts.data}</strong> (Apto ${opts.apto}) foi <strong style="color:#ef4444">cancelada</strong>.</p>
      ${FOOTER}`,
  }
}

/* ── Morador → Admin ─────────────────────────── */

export function emailAdminNovaReserva(opts: { nome: string; apto: string; data: string; hall: string; taxa: number; isencao: boolean }) {
  const taxa = opts.isencao ? `R$ ${opts.taxa.toFixed(2)} (isenção solicitada)` : `R$ ${opts.taxa.toFixed(2)}`
  return {
    subject: `🎉 Nova reserva solicitada — Apto ${opts.apto}`,
    html: `${BASE}
      <p>Uma nova reserva foi solicitada pelo portal do morador.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${row('Morador', opts.nome)}
        ${row('Apartamento', opts.apto)}
        ${row('Local', opts.hall)}
        ${row('Data', opts.data)}
        ${row('Taxa', taxa)}
      </table>
      <p style="color:#6b7280;font-size:13px">Acesse o painel administrativo para confirmar ou cancelar.</p>
      ${FOOTER}`,
  }
}

export function emailAdminNovaMudanca(opts: { nome: string; apto: string; data: string; tipo: string; periodo: string }) {
  const tipoStr = opts.tipo === 'entrada' ? 'Entrada' : 'Saída'
  const periodoStr = opts.periodo === 'manha' ? 'Manhã (08h–12h)' : 'Tarde (13h–17h)'
  return {
    subject: `🚛 Nova mudança solicitada — Apto ${opts.apto}`,
    html: `${BASE}
      <p>Uma mudança foi solicitada pelo portal do morador.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${row('Morador', opts.nome)}
        ${row('Apartamento', opts.apto)}
        ${row('Tipo', tipoStr)}
        ${row('Data', opts.data)}
        ${row('Período', periodoStr)}
      </table>
      <p style="color:#6b7280;font-size:13px">Acesse o painel administrativo para aprovar ou cancelar.</p>
      ${FOOTER}`,
  }
}

export function emailAdminDesistencia(opts: { nome: string; apto: string; data: string; tipo: 'salao' | 'mudanca'; hall?: string }) {
  const tipoStr = opts.tipo === 'salao' ? `reserva do ${opts.hall}` : 'mudança'
  return {
    subject: `🔔 Desistência — Apto ${opts.apto}`,
    html: `${BASE}
      <p>O morador <strong>${opts.nome}</strong> (Apto ${opts.apto}) desistiu da ${tipoStr} do dia <strong>${opts.data}</strong>.</p>
      <p style="color:#6b7280;font-size:13px">A data está disponível novamente.</p>
      ${FOOTER}`,
  }
}
