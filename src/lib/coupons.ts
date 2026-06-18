import { supabaseAdmin } from './supabase-admin';

export type CouponResult =
  | {
      valid: true;
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      discountAmount: number;
    }
  | { valid: false; message: string };

export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, message: 'Ingresá un código.' };

  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (!coupon || !coupon.active) return { valid: false, message: 'El cupón no existe o ya no está activo.' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, message: 'Este cupón venció.' };
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, message: 'Este cupón alcanzó su límite de usos.' };
  }
  if (coupon.min_purchase != null && subtotal < coupon.min_purchase) {
    return { valid: false, message: `Este cupón requiere una compra mínima de $${coupon.min_purchase}.` };
  }

  const discountAmount =
    coupon.discount_type === 'fixed'
      ? Math.min(Number(coupon.discount_value), subtotal)
      : Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    discountAmount,
  };
}

export async function registerCouponUsage(code: string) {
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('used_count')
    .eq('code', code)
    .maybeSingle();

  if (!coupon) return;

  await supabaseAdmin
    .from('coupons')
    .update({ used_count: coupon.used_count + 1 })
    .eq('code', code);
}
