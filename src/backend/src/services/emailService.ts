import { config } from '../config/index.js'

// Envío de emails vía Resend (https://resend.com — API REST simple).
// Sin RESEND_API_KEY configurada funciona en modo dev: loguea por consola.
export const emailService = {
  isConfigured(): boolean {
    return Boolean(config.email.resendApiKey)
  },

  async send(to: string, subject: string, html: string): Promise<{ sent: boolean }> {
    if (!this.isConfigured()) {
      console.log(`[EMAIL:dev] To: ${to} | Subject: ${subject}`)
      return { sent: false }
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.email.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: config.email.from, to: [to], subject, html }),
      })
      if (!res.ok) {
        console.error(`[EMAIL] Resend error ${res.status}: ${await res.text()}`)
        return { sent: false }
      }
      return { sent: true }
    } catch (err) {
      console.error('[EMAIL] Failed to send:', err)
      return { sent: false }
    }
  },

  verificationEmailHtml(verifyUrl: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1B5E20">Bienvenido a Spottruck 🚛</h2>
        <p>Confirmá tu correo electrónico para validar tu cuenta:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${verifyUrl}"
             style="background:#1B5E20;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
            Verificar mi email
          </a>
        </p>
        <p style="color:#757575;font-size:12px">Si no creaste una cuenta en Spottruck, ignorá este correo.</p>
      </div>`
  },
}
