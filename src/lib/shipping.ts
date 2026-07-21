// Tarifa provisoria única (nacional) hasta integrar cotización real con Correo Argentino,
// que requiere cuenta comercial (CUIT + contrato) todavía no dada de alta.
export const FLAT_SHIPPING_RATE = 5000;

export type DeliveryMethod = 'shipping' | 'pickup';

export function shippingCostFor(deliveryMethod: DeliveryMethod): number {
  return deliveryMethod === 'pickup' ? 0 : FLAT_SHIPPING_RATE;
}
