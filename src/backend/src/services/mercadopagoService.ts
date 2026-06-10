import { createHmac } from 'crypto'
import { config } from '../config/index.js'

const MP_API = 'https://api.mercadopago.com'

interface PreferenceResult {
  id: string
  initPoint: string
}

interface MPPayment {
  id: number
  status: string // approved | pending | rejected | refunded | cancelled
  external_reference?: string
  transaction_amount: number
}

// Integración con MercadoPago (Checkout Pro vía API REST).
// Sin MERCADOPAGO_ACCESS_TOKEN funciona en modo simulado: el hold se marca
// directamente como HELD sin cobro real (igual que el MVP).
export const mercadopagoService = {
  isConfigured(): boolean {
    return Boolean(config.mercadopago.accessToken)
  },

  // Crea una preferencia de Checkout Pro para que la empresa pague el viaje.
  // external_reference = id de nuestro Payment, para matchear en el webhook.
  async createPreference(params: {
    paymentId: string
    title: string
    amount: number
    payerEmail?: string
  }): Promise<PreferenceResult> {
    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.mercadopago.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: params.title,
            quantity: 1,
            unit_price: params.amount,
            currency_id: 'ARS',
          },
        ],
        payer: params.payerEmail ? { email: params.payerEmail } : undefined,
        external_reference: params.paymentId,
        notification_url: `${config.apiUrl}/api/v1/payments/webhook`,
        back_urls: {
          success: `${config.frontendUrl}/trips`,
          pending: `${config.frontendUrl}/trips`,
          failure: `${config.frontendUrl}/trips`,
        },
        auto_return: 'approved',
        statement_descriptor: 'SPOTTRUCK',
      }),
    })

    if (!res.ok) {
      throw new Error(`MercadoPago preference failed (${res.status}): ${await res.text()}`)
    }

    const data = (await res.json()) as { id: string; init_point: string }
    return { id: data.id, initPoint: data.init_point }
  },

  // Consulta un pago de MP (usado al procesar el webhook)
  async getPayment(mpPaymentId: string): Promise<MPPayment> {
    const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${config.mercadopago.accessToken}` },
    })
    if (!res.ok) {
      throw new Error(`MercadoPago getPayment failed (${res.status})`)
    }
    return (await res.json()) as MPPayment
  },

  // Validación de firma del webhook (header x-signature de MP).
  // Si no hay MERCADOPAGO_WEBHOOK_SECRET configurado, se acepta sin validar.
  verifyWebhookSignature(headers: {
    signature?: string
    requestId?: string
    dataId?: string
  }): boolean {
    const secret = config.mercadopago.webhookSecret
    if (!secret) return true
    if (!headers.signature || !headers.dataId) return false

    // Formato: "ts=<timestamp>,v1=<hmac>"
    const parts = Object.fromEntries(
      headers.signature.split(',').map((p) => p.trim().split('=') as [string, string])
    )
    if (!parts.ts || !parts.v1) return false

    const manifest = `id:${headers.dataId};request-id:${headers.requestId ?? ''};ts:${parts.ts};`
    const expected = createHmac('sha256', secret).update(manifest).digest('hex')
    return expected === parts.v1
  },
}
