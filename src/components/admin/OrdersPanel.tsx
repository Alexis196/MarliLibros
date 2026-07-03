'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminOrders, type AdminOrder } from '@/contexts/AdminOrdersContext';
import type { OrdersPageStats } from '@/lib/admin-stats';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function toShortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function exportToCSV(orders: AdminOrder[], filename: string) {
  const headers = ['ID', 'Cliente', 'Email', 'Teléfono', 'Dirección', 'Provincia', 'CP', 'Total', 'Estado', 'Despachado', 'Fecha'];
  const rows = orders.map(o => {
    const cfg = getStatusConfig(o.status, o.shipped);
    return [
      toShortId(o.id),
      o.customer_name,
      o.customer_email,
      o.customer_phone ?? '',
      o.shipping_address,
      o.province ?? '',
      o.postal_code ?? '',
      String(o.total_amount),
      cfg.label,
      o.shipped ? 'Sí' : 'No',
      new Date(o.created_at).toLocaleDateString('es-AR'),
    ];
  });
  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Status config ───────────────────────────────────────────────────────────

type StatusCfg = { label: string; icon: string; color: string; bg: string };

const STATUS_MAP: Record<string, StatusCfg> = {
  pending:           { label: 'Pago pendiente', icon: '⏳', color: '#C8A86B', bg: 'rgba(200,168,107,0.12)' },
  in_process:        { label: 'Procesando',     icon: '🔄', color: '#6B8EC8', bg: 'rgba(107,142,200,0.12)' },
  approved_pending:  { label: 'Por despachar',  icon: '📦', color: '#345457', bg: 'rgba(52,84,87,0.10)'    },
  approved_shipped:  { label: 'Despachado',     icon: '✓',  color: '#4A9B6F', bg: 'rgba(74,155,111,0.12)' },
  rejected:          { label: 'Rechazado',      icon: '✗',  color: '#B85C5C', bg: 'rgba(184,92,92,0.12)'  },
  cancelled:         { label: 'Cancelado',      icon: '—',  color: '#9AA6A4', bg: 'rgba(154,166,164,0.12)'},
};

function getStatusConfig(status: string, shipped: boolean): StatusCfg {
  if (status === 'approved') return shipped ? STATUS_MAP.approved_shipped : STATUS_MAP.approved_pending;
  return STATUS_MAP[status] ?? { label: status, icon: '●', color: '#9AA6A4', bg: 'rgba(154,166,164,0.12)' };
}

// ─── Amount filter options ────────────────────────────────────────────────────

const AMOUNT_OPTIONS = [
  { label: 'Monto', key: '', min: null as number | null, max: null as number | null },
  { label: '< $5.000',    key: 'lt5k',   min: null,  max: 5000  },
  { label: '$5k – $20k',  key: '5k20k',  min: 5000,  max: 20000 },
  { label: '$20k – $50k', key: '20k50k', min: 20000, max: 50000 },
  { label: '> $50.000',   key: 'gt50k',  min: 50000, max: null  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status, shipped }: { status: string; shipped: boolean }) {
  const cfg = getStatusConfig(status, shipped);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4 border-t border-gray-100 first:border-t-0 animate-pulse">
      <div className="hidden sm:grid items-center gap-3" style={{ gridTemplateColumns: '28px 88px 1fr 96px 52px 90px 130px 68px' }}>
        <div className="w-4 h-4 bg-gray-100 rounded" />
        <div className="h-5 bg-gray-100 rounded w-16" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-100 rounded w-36" />
          <div className="h-3 bg-gray-100 rounded w-28" />
        </div>
        <div className="h-3.5 bg-gray-100 rounded w-20" />
        <div className="h-3.5 bg-gray-100 rounded w-10" />
        <div className="h-4 bg-gray-100 rounded w-20 ml-auto" />
        <div className="h-5 bg-gray-100 rounded-full w-24" />
        <div className="h-3 bg-gray-100 rounded w-14" />
      </div>
      <div className="flex sm:hidden items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between gap-2">
            <div className="h-3.5 bg-gray-100 rounded w-32" />
            <div className="h-3.5 bg-gray-100 rounded w-20" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 bg-gray-100 rounded-full w-24" />
            <div className="h-3 bg-gray-100 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

type OrderRowProps = {
  order: AdminOrder;
  isFirst: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpenPanel: () => void;
  onApprove: () => void;
  onShip: () => void;
  onReject: () => void;
  updatingId: string | null;
};

function OrderRow({ order, isFirst, selected, onSelect, onOpenPanel, onApprove, onShip, onReject, updatingId }: OrderRowProps) {
  const isUpdating = updatingId === order.id;
  const canApprove = order.status === 'pending' || order.status === 'in_process';
  const canShip = order.status === 'approved' && !order.shipped;
  const isPremium = order.total_amount > 50000;
  const isUrgent = canApprove && (Date.now() - new Date(order.created_at).getTime()) < 30 * 60 * 1000;
  const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0);

  const leftBorderColor = isUrgent ? '#C8A86B' : isPremium ? '#C8A86B' : 'transparent';

  const whatsappHref = order.customer_phone
    ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(order.customer_name)}%2C%20te%20contactamos%20de%20Marli%20Libros.`
    : null;

  return (
    <div
      className={`group relative ${isFirst ? '' : 'border-t border-gray-100'}`}
      style={{ borderLeft: `3px solid ${leftBorderColor}` }}
    >
      {/* Desktop row */}
      <div
        className="hidden sm:grid items-center gap-3 px-5 py-3.5 hover:bg-[rgba(52,84,87,0.025)] transition-colors duration-150 cursor-pointer"
        style={{ gridTemplateColumns: '28px 88px 1fr 96px 52px 90px 130px 68px' }}
        onClick={onOpenPanel}
      >
        {/* Checkbox */}
        <div onClick={e => { e.stopPropagation(); onSelect(); }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            className="rounded cursor-pointer w-4 h-4"
            style={{ accentColor: '#345457' }}
          />
        </div>

        {/* Short ID */}
        <span
          className="font-mono text-[11px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded select-all"
          onClick={e => e.stopPropagation()}
          title={order.id}
        >
          #{toShortId(order.id).slice(0, 4)}
        </span>

        {/* Customer */}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 truncate flex items-center gap-1.5">
            {order.customer_name}
            {isPremium && <span title="Pedido premium" style={{ color: '#C8A86B', fontSize: '8px' }}>●</span>}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{order.customer_email}</p>
        </div>

        {/* Province */}
        <span className="text-[12px] text-gray-500 truncate">{order.province ?? '—'}</span>

        {/* Items */}
        <span className={`text-[12px] ${itemCount > 5 ? 'font-semibold text-amber-600' : 'text-gray-500'}`}>
          {itemCount} lib.
        </span>

        {/* Amount */}
        <span
          className="text-[13px] font-bold text-right block"
          style={{ color: isPremium ? '#C8A86B' : '#345457' }}
        >
          {formatPrice(order.total_amount)}
        </span>

        {/* Status */}
        <StatusBadge status={order.status} shipped={order.shipped} />

        {/* Time */}
        <span className={`text-[12px] ${isUrgent ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
          {formatRelative(order.created_at)}
        </span>
      </div>

      {/* Hover actions overlay — desktop only */}
      <div
        className="hidden sm:flex absolute right-0 top-0 bottom-0 items-center gap-1.5 pr-4 pl-14 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.97) 48px)' }}
        onClick={e => e.stopPropagation()}
      >
        {canApprove && (
          <button
            onClick={onApprove}
            disabled={isUpdating}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: '#345457' }}
          >
            ✓ Aprobar
          </button>
        )}
        {canShip && (
          <button
            onClick={onShip}
            disabled={isUpdating}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold disabled:opacity-60"
            style={{ backgroundColor: 'rgba(52,84,87,0.12)', color: '#345457' }}
          >
            📦 Despachar
          </button>
        )}
        {canApprove && (
          <button
            onClick={onReject}
            disabled={isUpdating}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold disabled:opacity-60"
            style={{ backgroundColor: 'rgba(184,92,92,0.10)', color: '#B85C5C' }}
          >
            ✗
          </button>
        )}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg text-[13px]"
            style={{ backgroundColor: 'rgba(37,211,102,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            💬
          </a>
        )}
      </div>

      {/* Mobile row */}
      <button
        className="sm:hidden w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-[rgba(52,84,87,0.02)] active:bg-[rgba(52,84,87,0.05)] transition-colors"
        onClick={onOpenPanel}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
          style={{ backgroundColor: '#345457' }}
        >
          {initials(order.customer_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-gray-800 truncate">{order.customer_name}</p>
            <span className="text-[13px] font-bold shrink-0" style={{ color: isPremium ? '#C8A86B' : '#345457' }}>
              {formatPrice(order.total_amount)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <StatusBadge status={order.status} shipped={order.shipped} />
            <span className="text-[11px] text-gray-400">{formatRelative(order.created_at)}</span>
            {order.province && <span className="text-[11px] text-gray-400">{order.province}</span>}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA6A4" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

// ─── Side panel ───────────────────────────────────────────────────────────────

type SidePanelProps = {
  order: AdminOrder;
  onClose: () => void;
  onApprove: () => void;
  onShip: () => void;
  onReject: () => void;
  updatingId: string | null;
};

function SidePanel({ order, onClose, onApprove, onShip, onReject, updatingId }: SidePanelProps) {
  const isUpdating = updatingId === order.id;
  const canApprove = order.status === 'pending' || order.status === 'in_process';
  const canShip = order.status === 'approved' && !order.shipped;
  const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0);

  const whatsappHref = order.customer_phone
    ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(order.customer_name)}%2C%20te%20contactamos%20de%20Marli%20Libros.`
    : null;

  return (
    <>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Pedido #{toShortId(order.id)}
          </p>
          <p className="text-[13px] text-gray-500 mt-0.5">{formatRelative(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`/admin/pedidos/${order.id}/etiqueta`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-[#345457] hover:bg-[rgba(52,84,87,0.06)] transition-all duration-200"
            title="Imprimir etiqueta"
          >
            🖨
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap shrink-0">
        <StatusBadge status={order.status} shipped={order.shipped} />
        {canApprove && (
          <button
            onClick={onApprove}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: '#345457' }}
          >
            {isUpdating ? 'Actualizando…' : '✓ Aprobar'}
          </button>
        )}
        {canShip && (
          <button
            onClick={onShip}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-60"
            style={{ backgroundColor: 'rgba(52,84,87,0.12)', color: '#345457' }}
          >
            {isUpdating ? 'Marcando…' : '📦 Despachar'}
          </button>
        )}
        {order.shipped && (
          <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: '#4A9B6F' }}>
            ✓ Despachado
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Customer */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Cliente</p>
          <p className="text-[14px] font-semibold text-gray-800">{order.customer_name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={`mailto:${order.customer_email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 hover:border-[#345457] hover:text-[#345457] transition-all duration-200"
            >
              ✉ {order.customer_email}
            </a>
            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 hover:border-[#345457] hover:text-[#345457] transition-all duration-200"
              >
                📞 {order.customer_phone}
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all duration-200"
                style={{ backgroundColor: '#25D366' }}
              >
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Envío</p>
          <p className="text-[13px] text-gray-700">{order.shipping_address}</p>
          {(order.province || order.postal_code) && (
            <p className="text-[13px] text-gray-600 mt-0.5">
              {[order.province, order.postal_code && `CP ${order.postal_code}`].filter(Boolean).join(' · ')}
            </p>
          )}
          {order.address_reference && (
            <p className="text-[12px] text-gray-400 mt-1">Ref: {order.address_reference}</p>
          )}
        </div>

        {/* Items */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Items ({itemCount} {itemCount === 1 ? 'libro' : 'libros'})
          </p>
          <div className="space-y-2.5">
            {order.order_items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-700">{item.title}</p>
                  {item.author_name && <p className="text-[11px] text-gray-400">{item.author_name}</p>}
                </div>
                <div className="text-right shrink-0">
                  {item.quantity > 1 && <p className="text-[11px] text-gray-400">×{item.quantity}</p>}
                  <p className="text-[13px] font-semibold" style={{ color: '#345457' }}>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total</span>
              <span className="text-[15px] font-bold" style={{ color: '#345457' }}>
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
        {canApprove && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              disabled={isUpdating}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#345457' }}
            >
              {isUpdating ? 'Actualizando…' : '✓ Aprobar pedido'}
            </button>
            <button
              onClick={onReject}
              disabled={isUpdating}
              className="py-2.5 px-4 rounded-xl text-[13px] font-semibold disabled:opacity-60"
              style={{ backgroundColor: 'rgba(184,92,92,0.10)', color: '#B85C5C' }}
            >
              Rechazar
            </button>
          </div>
        )}
        {canShip && (
          <button
            onClick={onShip}
            disabled={isUpdating}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: '#345457' }}
          >
            {isUpdating ? 'Marcando…' : '📦 Marcar como despachado'}
          </button>
        )}
        <a
          href={`/admin/pedidos/${order.id}/etiqueta`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-all duration-200"
        >
          🖨 Imprimir etiqueta
        </a>
      </div>
    </>
  );
}

// ─── Bulk toolbar ─────────────────────────────────────────────────────────────

type BulkToolbarProps = {
  count: number;
  onApprove: () => void;
  onShip: () => void;
  onExport: () => void;
  onClear: () => void;
};

function BulkToolbar({ count, onApprove, onShip, onExport, onClear }: BulkToolbarProps) {
  return (
    <div
      className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 rounded-2xl print:hidden overflow-x-auto"
      style={{ backgroundColor: '#1A2B2C', boxShadow: '0 8px 32px rgba(0,0,0,0.28)', maxWidth: 'calc(100vw - 32px)' }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {count} pedido{count !== 1 ? 's' : ''}
        </span>
        <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <button
          onClick={onApprove}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:bg-white/10 transition-all whitespace-nowrap shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.2)' }}
        >
          ✓ Aprobar
        </button>
        <button
          onClick={onShip}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:bg-white/10 transition-all whitespace-nowrap shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.2)' }}
        >
          📦 Despachar
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:bg-white/10 transition-all whitespace-nowrap shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Exportar
        </button>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all shrink-0"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

type EmptyStateProps = {
  dispatchOnly: boolean;
  search: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
};

function EmptyState({ dispatchOnly, search, hasFilters, onClearFilters, onClearSearch }: EmptyStateProps) {
  let icon = '📬';
  let heading = 'Todavía no hay pedidos';
  let sub = 'Cuando alguien compre en la tienda aparecerán aquí.';
  let action: React.ReactNode = null;

  if (search) {
    icon = '🔍';
    heading = `Sin resultados para "${search}"`;
    sub = 'Intentá buscar por email o número de pedido.';
    action = (
      <button
        onClick={onClearSearch}
        className="mt-1 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-all duration-200"
      >
        Limpiar búsqueda
      </button>
    );
  } else if (hasFilters) {
    icon = '📋';
    heading = 'Sin resultados con estos filtros';
    sub = 'Probá cambiando o quitando algunos filtros.';
    action = (
      <button
        onClick={onClearFilters}
        className="mt-1 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-all duration-200"
      >
        Limpiar filtros
      </button>
    );
  } else if (dispatchOnly) {
    icon = '✓';
    heading = '¡Todo al día!';
    sub = 'No hay pedidos pendientes de despacho.';
  }

  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{ backgroundColor: 'rgba(52,84,87,0.06)' }}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-600">{heading}</p>
      <p className="text-xs text-gray-400 text-center max-w-xs">{sub}</p>
      {action}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const LIMIT = 25;

export function OrdersPanel({ initialDispatchOnly, stats }: { initialDispatchOnly: boolean; stats: OrdersPageStats }) {
  const router = useRouter();
  const { getOrders, markShipped: markShippedCtx, updateStatus: updateStatusCtx, bulkUpdateStatus, bulkMarkShipped } = useAdminOrders();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amountKey, setAmountKey] = useState('');
  const [dispatchOnly, setDispatchOnly] = useState(initialDispatchOnly);

  // UI
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelOrderId, setPanelOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const amountOption = AMOUNT_OPTIONS.find(o => o.key === amountKey) ?? AMOUNT_OPTIONS[0];
  const activeFilterCount = [statusFilter !== '', dateFilter !== '', amountKey !== ''].filter(Boolean).length;
  const hasMore = orders.length < total;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch when filters change — reset list
  const fetchOrders = useCallback(() => {
    setLoading(true);
    setOrders([]);
    setSelectedIds(new Set());
    getOrders({
      dispatchOnly,
      search: debouncedSearch,
      status: statusFilter,
      dateFilter,
      minAmount: amountOption.min,
      maxAmount: amountOption.max,
      limit: LIMIT,
      offset: 0,
    }).then(({ orders: data, total: t }) => {
      setOrders(data);
      setTotal(t);
      setLoading(false);
    });
  }, [dispatchOnly, debouncedSearch, statusFilter, dateFilter, amountOption, getOrders]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Close panel if its order disappears from list
  useEffect(() => {
    if (panelOrderId && !orders.find(o => o.id === panelOrderId)) {
      setPanelOrderId(null);
    }
  }, [orders, panelOrderId]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (panelOrderId) { setPanelOrderId(null); return; }
        if (selectedIds.size > 0) { setSelectedIds(new Set()); return; }
        if (search) { setSearch(''); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOrderId, selectedIds, search]);

  // Load more
  const loadMore = async () => {
    setLoadingMore(true);
    const { orders: more } = await getOrders({
      dispatchOnly,
      search: debouncedSearch,
      status: statusFilter,
      dateFilter,
      minAmount: amountOption.min,
      maxAmount: amountOption.max,
      limit: LIMIT,
      offset: orders.length,
    });
    setOrders(prev => [...prev, ...more]);
    setLoadingMore(false);
  };

  // Single actions
  const markShipped = async (id: string) => {
    setUpdatingId(id);
    const ok = await markShippedCtx(id);
    if (ok) {
      setOrders(prev =>
        dispatchOnly ? prev.filter(o => o.id !== id) : prev.map(o => o.id === id ? { ...o, shipped: true } : o)
      );
      router.refresh();
    }
    setUpdatingId(null);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const ok = await updateStatusCtx(id, status);
    if (ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      router.refresh();
    }
    setUpdatingId(null);
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    const ids = [...selectedIds];
    await bulkUpdateStatus(ids, 'approved');
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'approved' } : o));
    setSelectedIds(new Set());
    router.refresh();
  };

  const handleBulkShip = async () => {
    const ids = [...selectedIds];
    await bulkMarkShipped(ids);
    setOrders(prev =>
      dispatchOnly
        ? prev.filter(o => !ids.includes(o.id))
        : prev.map(o => ids.includes(o.id) ? { ...o, shipped: true } : o)
    );
    setSelectedIds(new Set());
    router.refresh();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === orders.length && orders.length > 0 ? new Set() : new Set(orders.map(o => o.id)));
  };

  const clearFilters = () => { setStatusFilter(''); setDateFilter(''); setAmountKey(''); setDispatchOnly(false); };

  const panelOrder = panelOrderId ? (orders.find(o => o.id === panelOrderId) ?? null) : null;

  // Filter pills style
  const pillBase = 'px-3 py-1.5 rounded-full text-[13px] font-medium border cursor-pointer transition-all duration-200 outline-none';
  const pillActive = `${pillBase} text-white border-[#345457]`;
  const pillInactive = `${pillBase} bg-white text-gray-500 border-gray-200 hover:border-[#345457]/40 hover:text-[#345457]`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
            Pedidos
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#9AA6A4' }}>
            <span style={{ color: '#345457', fontWeight: 600 }}>{stats.total}</span> total
            {stats.pending > 0 && (
              <> · <span className="font-semibold text-amber-600">{stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}</span></>
            )}
            {stats.dispatchPending > 0 && (
              <> · <span className="font-semibold" style={{ color: '#345457' }}>{stats.dispatchPending} por despachar</span></>
            )}
            {stats.revenueToday > 0 && (
              <> · <span className="font-medium">{formatPrice(stats.revenueToday)} hoy</span></>
            )}
          </p>
        </div>
        <button
          onClick={() => exportToCSV(orders, `pedidos-${new Date().toISOString().slice(0, 10)}.csv`)}
          disabled={orders.length === 0}
          className="px-3 py-2 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-all duration-200 disabled:opacity-40"
        >
          Exportar CSV
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#9AA6A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, email, libro…"
          className="w-full h-11 pl-10 pr-14 rounded-xl border text-[14px] text-gray-700 placeholder-gray-400 outline-none transition-all duration-200 bg-white"
          style={{
            borderColor: searchFocused ? '#345457' : '#E5E7EB',
            boxShadow: searchFocused ? '0 0 0 3px rgba(52,84,87,0.12)' : 'none',
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {search ? (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        ) : (
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] font-medium text-gray-300 pointer-events-none border border-gray-200 rounded px-1 py-0.5">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setDispatchOnly(false); setStatusFilter(''); }} className={!dispatchOnly && !statusFilter ? pillActive : pillInactive} style={!dispatchOnly && !statusFilter ? { backgroundColor: '#345457' } : {}}>
          Todos
        </button>
        <button onClick={() => { setDispatchOnly(true); setStatusFilter(''); }} className={dispatchOnly ? pillActive : pillInactive} style={dispatchOnly ? { backgroundColor: '#345457' } : {}}>
          Por despachar
        </button>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); if (e.target.value) setDispatchOnly(false); }}
          className={`${pillBase} pr-7`}
          style={statusFilter ? { backgroundColor: '#345457', color: '#fff', borderColor: '#345457' } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}
        >
          <option value="">Estado ▾</option>
          <option value="pending">Pago pendiente</option>
          <option value="in_process">Procesando</option>
          <option value="approved">Confirmado</option>
          <option value="rejected">Rechazado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className={`${pillBase} pr-7`}
          style={dateFilter ? { backgroundColor: '#345457', color: '#fff', borderColor: '#345457' } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}
        >
          <option value="">Fecha ▾</option>
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>

        <select
          value={amountKey}
          onChange={e => setAmountKey(e.target.value)}
          className={`${pillBase} pr-7`}
          style={amountKey ? { backgroundColor: '#345457', color: '#fff', borderColor: '#345457' } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}
        >
          {AMOUNT_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}{o.key ? '' : ' ▾'}</option>
          ))}
        </select>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-full text-[13px] font-medium text-gray-400 hover:text-red-400 transition-colors duration-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Active search chip */}
      {debouncedSearch && !loading && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-gray-500">
            {total} resultado{total !== 1 ? 's' : ''} para <strong>{debouncedSearch}</strong>
          </span>
          <button onClick={() => setSearch('')} className="text-[12px] text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Orders card */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(52,84,87,0.06)' }}>
        {/* Table header — desktop only, shown when not loading */}
        {!loading && orders.length > 0 && (
          <div
            className="hidden sm:grid items-center gap-3 px-5 py-3 border-b border-gray-100"
            style={{
              gridTemplateColumns: '28px 88px 1fr 96px 52px 90px 130px 68px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#9AA6A4',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <input
              type="checkbox"
              className="rounded w-4 h-4"
              style={{ accentColor: '#345457' }}
              checked={selectedIds.size === orders.length && orders.length > 0}
              onChange={toggleSelectAll}
            />
            <span>Pedido</span>
            <span>Cliente</span>
            <span>Destino</span>
            <span>Items</span>
            <span className="text-right">Monto</span>
            <span>Estado</span>
            <span>Cuándo</span>
          </div>
        )}

        {loading ? (
          <>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</>
        ) : orders.length === 0 ? (
          <EmptyState
            dispatchOnly={dispatchOnly}
            search={debouncedSearch}
            hasFilters={activeFilterCount > 0}
            onClearFilters={clearFilters}
            onClearSearch={() => setSearch('')}
          />
        ) : (
          <>
            {orders.map((order, i) => (
              <OrderRow
                key={order.id}
                order={order}
                isFirst={i === 0}
                selected={selectedIds.has(order.id)}
                onSelect={() => toggleSelect(order.id)}
                onOpenPanel={() => setPanelOrderId(order.id)}
                onApprove={() => updateStatus(order.id, 'approved')}
                onShip={() => markShipped(order.id)}
                onReject={() => updateStatus(order.id, 'rejected')}
                updatingId={updatingId}
              />
            ))}

            {/* Load more */}
            {(hasMore || loadingMore) && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[13px] text-gray-400">
                  Mostrando {orders.length} de {total}
                </span>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-1.5 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-500 hover:border-[#345457] hover:text-[#345457] transition-all duration-200 disabled:opacity-60"
                >
                  {loadingMore ? 'Cargando…' : `Cargar ${Math.min(LIMIT, total - orders.length)} más`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Side panel backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200 print:hidden"
        style={{
          background: 'rgba(0,0,0,0.08)',
          opacity: panelOrderId ? 1 : 0,
          pointerEvents: panelOrderId ? 'auto' : 'none',
        }}
        onClick={() => setPanelOrderId(null)}
      />

      {/* Side panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-[480px] bg-white flex flex-col transition-transform duration-[250ms] ease-out print:hidden"
        style={{
          transform: panelOrderId ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.10)',
          borderLeft: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {panelOrder && (
          <SidePanel
            order={panelOrder}
            onClose={() => setPanelOrderId(null)}
            onApprove={() => updateStatus(panelOrder.id, 'approved')}
            onShip={() => markShipped(panelOrder.id)}
            onReject={() => updateStatus(panelOrder.id, 'rejected')}
            updatingId={updatingId}
          />
        )}
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <BulkToolbar
          count={selectedIds.size}
          onApprove={handleBulkApprove}
          onShip={handleBulkShip}
          onExport={() => exportToCSV(orders.filter(o => selectedIds.has(o.id)), 'pedidos-seleccionados.csv')}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
