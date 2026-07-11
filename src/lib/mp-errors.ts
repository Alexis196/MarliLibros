// Traducción de los status_detail de Mercado Pago a mensajes claros para el cliente.
// Referencia: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/response-handling/collection-results

const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'Revisá el número de la tarjeta e intentá de nuevo.',
  cc_rejected_bad_filled_date: 'Revisá la fecha de vencimiento de la tarjeta.',
  cc_rejected_bad_filled_security_code: 'Revisá el código de seguridad de la tarjeta.',
  cc_rejected_bad_filled_other: 'Revisá los datos de la tarjeta e intentá de nuevo.',
  cc_rejected_call_for_authorize: 'Tu banco necesita que autorices el pago. Comunicate con tu banco y volvé a intentar.',
  cc_rejected_card_disabled: 'La tarjeta está inactiva. Comunicate con tu banco o probá con otra tarjeta.',
  cc_rejected_card_error: 'La tarjeta no pudo procesar el pago. Probá con otra tarjeta.',
  cc_rejected_duplicated_payment: 'Ya hiciste un pago por este monto. Si necesitás pagar de nuevo, usá otra tarjeta.',
  cc_rejected_high_risk: 'El pago fue rechazado por controles de seguridad. Probá con otro medio de pago.',
  cc_rejected_blacklist: 'El pago fue rechazado por controles de seguridad. Probá con otro medio de pago.',
  cc_rejected_insufficient_amount: 'La tarjeta no tiene fondos suficientes.',
  cc_rejected_invalid_installments: 'La tarjeta no permite esa cantidad de cuotas. Elegí otra opción de cuotas.',
  cc_rejected_max_attempts: 'Alcanzaste el límite de intentos permitidos. Probá con otra tarjeta.',
  cc_rejected_other_reason: 'La tarjeta rechazó el pago. Probá con otra tarjeta u otro medio de pago.',
};

export function rejectionMessage(statusDetail?: string | null): string {
  return (
    (statusDetail && REJECTION_MESSAGES[statusDetail]) ||
    'El pago fue rechazado. Probá con otra tarjeta u otro medio de pago.'
  );
}
