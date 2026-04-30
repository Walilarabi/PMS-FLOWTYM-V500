import React, { useEffect, useState } from 'react';
import { useReservationStore } from '../store/reservationStore';
import { useAppStore, useHotelId } from '@/core/store/appStore';
import { eventBus } from '@/core/events/eventBus';
import { reservationService } from '../services/reservationService';
import type { Reservation, ReservationStatus, ReservationSource } from '@/shared/types/common';

// ─── Configs ────────────────────────────────────────────────────────

const STATUS: Record<ReservationStatus, { label: string; color: string; bg: string; icon: string }> = {
  confirmed:   { label: 'Confirmée',   color: '#1E40AF', bg: '#DBEAFE',  icon: 'fa-check-circle' },
  pending:     { label: 'En attente',  color: '#92400E', bg: '#FEF3C7',  icon: 'fa-clock' },
  checked_in:  { label: 'Check-in',    color: '#065F46', bg: '#D1FAE5',  icon: 'fa-sign-in-alt' },
  checked_out: { label: 'Check-out',   color: '#374151', bg: '#F3F4F6',  icon: 'fa-sign-out-alt' },
  cancelled:   { label: 'Annulée',     color: '#991B1B', bg: '#FEE2E2',  icon: 'fa-times-circle' },
  no_show:     { label: 'No-show',     color: '#6D28D9', bg: '#EDE9FE',  icon: 'fa-user-slash' },
};

const SOURCE_COLORS: Record<string, string> = {
  'Direct':      '#10B981',
  'Booking.com': '#003580',
  'Expedia':     '#d4a000',
  'Airbnb':      '#FF5A5F',
  'Phone':       '#8B5CF6',
  'Agency':      '#6B7280',
  'Walk-in':     '#F59E0B',
  'GDS':         '#3B82F6',
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const nights = (ci: string, co: string) => Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);

// ─── Badge ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ReservationStatus }> = ({ status }) => {
  const cfg = STATUS[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: cfg.bg, color: cfg.color,
      fontSize: 'var(--font-size-xs)', fontWeight: 600,
    }}>
      <i className={`fas ${cfg.icon}`} style={{ fontSize: 10 }} />
      {cfg.label}
    </span>
  );
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 'var(--radius-full)',
    background: `${SOURCE_COLORS[source] ?? '#6B7280'}18`,
    color: SOURCE_COLORS[source] ?? '#6B7280',
    fontSize: 'var(--font-size-xs)', fontWeight: 600,
    border: `1px solid ${SOURCE_COLORS[source] ?? '#6B7280'}30`,
  }}>
    {source}
  </span>
);

// ─── KPI Cards ──────────────────────────────────────────────────────

const KPIs: React.FC<{ reservations: Reservation[] }> = ({ reservations }) => {
  const today = new Date().toISOString().split('T')[0];

  const arrivals  = reservations.filter(r => r.check_in === today && r.status === 'confirmed').length;
  const departures = reservations.filter(r => r.check_out === today && r.status === 'checked_in').length;
  const inhouse   = reservations.filter(r => r.status === 'checked_in').length;
  const pending   = reservations.filter(r => r.status === 'pending').length;
  const totalRev  = reservations.filter(r => !['cancelled','no_show'].includes(r.status))
    .reduce((s, r) => s + (r.total_amount ?? 0), 0);

  const kpis = [
    { label: 'Arrivées aujourd\'hui', value: arrivals,  icon: 'fa-sign-in-alt',  color: '#10B981' },
    { label: 'Départs aujourd\'hui',  value: departures, icon: 'fa-sign-out-alt', color: '#F59E0B' },
    { label: 'En cours de séjour',    value: inhouse,   icon: 'fa-bed',          color: '#8B5CF6' },
    { label: 'En attente',            value: pending,   icon: 'fa-clock',        color: '#EF4444' },
    { label: 'CA total',              value: fmt(totalRev), icon: 'fa-euro-sign', color: '#3B82F6', isText: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
      {kpis.map(k => (
        <div key={k.label} className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {k.label}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${k.icon}`} style={{ fontSize: 13, color: k.color }} />
            </div>
          </div>
          <div style={{ fontSize: k.isText ? 'var(--font-size-lg)' : 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-text)' }}>
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Filters ────────────────────────────────────────────────────────

interface Filters {
  search: string;
  status: ReservationStatus | 'all';
  source: ReservationSource | 'all';
  period: 'all' | 'today' | 'week' | 'month';
}

const Toolbar: React.FC<{
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
  onNew: () => void;
}> = ({ filters, onChange, total, onNew }) => {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
        <i className="fas fa-search" style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)', fontSize: 13,
        }} />
        <input
          className="input"
          placeholder="Nom, email, référence..."
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Status filter */}
      <select
        className="input"
        value={filters.status}
        onChange={e => set({ status: e.target.value as Filters['status'] })}
        style={{ width: 160 }}
      >
        <option value="all">Tous les statuts</option>
        {(Object.keys(STATUS) as ReservationStatus[]).map(s => (
          <option key={s} value={s}>{STATUS[s].label}</option>
        ))}
      </select>

      {/* Source filter */}
      <select
        className="input"
        value={filters.source}
        onChange={e => set({ source: e.target.value as Filters['source'] })}
        style={{ width: 150 }}
      >
        <option value="all">Tous les canaux</option>
        {Object.keys(SOURCE_COLORS).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Period filter */}
      <select
        className="input"
        value={filters.period}
        onChange={e => set({ period: e.target.value as Filters['period'] })}
        style={{ width: 140 }}
      >
        <option value="all">Toute période</option>
        <option value="today">Aujourd'hui</option>
        <option value="week">Cette semaine</option>
        <option value="month">Ce mois</option>
      </select>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {total} résultat{total > 1 ? 's' : ''}
        </span>
        <button className="btn btn-primary" onClick={onNew}>
          <i className="fas fa-plus" />
          Nouvelle réservation
        </button>
      </div>
    </div>
  );
};

// ─── Table Row ──────────────────────────────────────────────────────

const ReservationRow: React.FC<{
  res: Reservation;
  onAction: (action: 'checkin' | 'checkout' | 'cancel' | 'view', res: Reservation) => void;
}> = ({ res, onAction }) => {
  const [hover, setHover] = useState(false);
  const n = nights(res.check_in, res.check_out);
  const solde = (res.total_amount ?? 0) - (res.paid_amount ?? 0);

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: hover ? '#FAFBFF' : 'transparent', cursor: 'pointer' }}
      onClick={() => onAction('view', res)}
    >
      {/* Référence */}
      <td>
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
          {res.reference ?? res.id.slice(0, 8).toUpperCase()}
        </span>
      </td>

      {/* Client */}
      <td>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
          {(res.guest_name ?? `${res.guest?.first_name ?? ''} ${res.guest?.last_name ?? ''}`.trim()) || '—'}
        </div>
        {res.guest_email && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{res.guest_email}</div>
        )}
      </td>

      {/* Chambre */}
      <td>
        <span style={{
          background: 'var(--color-primary-light)', color: 'var(--color-accent)',
          padding: '2px 8px', borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-xs)', fontWeight: 700,
        }}>
          {res.room_number ?? res.room?.number ?? '—'}
        </span>
        {(res.room_type || res.room?.type) && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {res.room_type ?? res.room?.type}
          </div>
        )}
      </td>

      {/* Dates */}
      <td>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
          {fmtDate(res.check_in)}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          → {fmtDate(res.check_out)} · <strong>{n}</strong> nuit{n > 1 ? 's' : ''}
        </div>
      </td>

      {/* Montant */}
      <td>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{fmt(res.total_amount ?? 0)}</div>
        {solde > 0 && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 600 }}>
            Solde: {fmt(solde)}
          </div>
        )}
        {solde <= 0 && res.paid_amount > 0 && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 600 }}>
            ✓ Soldé
          </div>
        )}
      </td>

      {/* Canal */}
      <td><SourceBadge source={res.source ?? 'Direct'} /></td>

      {/* Statut */}
      <td><StatusBadge status={res.status as ReservationStatus} /></td>

      {/* Actions */}
      <td onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {res.status === 'confirmed' && (
            <button
              className="btn btn-sm"
              onClick={() => onAction('checkin', res)}
              title="Effectuer le check-in"
              style={{ background: '#D1FAE5', color: '#065F46', border: 'none' }}
            >
              <i className="fas fa-sign-in-alt" />
            </button>
          )}
          {res.status === 'checked_in' && (
            <button
              className="btn btn-sm"
              onClick={() => onAction('checkout', res)}
              title="Effectuer le check-out"
              style={{ background: '#FEF3C7', color: '#92400E', border: 'none' }}
            >
              <i className="fas fa-sign-out-alt" />
            </button>
          )}
          {['confirmed', 'pending'].includes(res.status) && (
            <button
              className="btn btn-sm"
              onClick={() => onAction('cancel', res)}
              title="Annuler"
              style={{ background: '#FEE2E2', color: '#991B1B', border: 'none' }}
            >
              <i className="fas fa-times" />
            </button>
          )}
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => onAction('view', res)}
            title="Voir le détail"
          >
            <i className="fas fa-eye" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Detail Panel ───────────────────────────────────────────────────

const DetailPanel: React.FC<{ res: Reservation; onClose: () => void }> = ({ res, onClose }) => {
  const n = nights(res.check_in, res.check_out);
  const cfg = STATUS[res.status as ReservationStatus];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'relative', width: 460, height: '100vh',
        background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}>
              {res.reference ?? res.id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
              {res.guest_name ?? '—'}
            </div>
            <StatusBadge status={res.status as ReservationStatus} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 18 }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-5)' }}>

          {/* Séjour */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              Séjour
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {[
                { label: 'Check-in', value: fmtDate(res.check_in), icon: 'fa-sign-in-alt', color: '#10B981' },
                { label: 'Check-out', value: fmtDate(res.check_out), icon: 'fa-sign-out-alt', color: '#F59E0B' },
                { label: 'Nuits', value: `${n} nuit${n > 1 ? 's' : ''}`, icon: 'fa-moon', color: '#8B5CF6' },
                { label: 'Chambre', value: res.room_number ?? '—', icon: 'fa-bed', color: '#3B82F6' },
                { label: 'PAX', value: `${res.adults} adulte${res.adults > 1 ? 's' : ''}${res.children > 0 ? ` + ${res.children} enfant${res.children > 1 ? 's' : ''}` : ''}`, icon: 'fa-users', color: '#6B7280' },
                { label: 'Canal', value: res.source ?? '—', icon: 'fa-globe', color: SOURCE_COLORS[res.source ?? ''] ?? '#6B7280' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <i className={`fas ${item.icon}`} style={{ fontSize: 11, color: item.color }} />
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{item.label}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Financier */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              Financier
            </div>
            <div className="card">
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Montant total', value: fmt(res.total_amount ?? 0), bold: true },
                  { label: 'Payé', value: fmt(res.paid_amount ?? 0), color: '#10B981' },
                  { label: 'Solde', value: fmt((res.total_amount ?? 0) - (res.paid_amount ?? 0)), color: (res.total_amount ?? 0) - (res.paid_amount ?? 0) > 0 ? '#EF4444' : '#10B981' },
                  { label: 'Taxe de séjour', value: fmt(res.city_tax ?? 0), color: 'var(--color-text-secondary)' },
                  { label: 'Mode de paiement', value: res.payment_mode ?? '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: row.bold ? 700 : 600, color: row.color ?? 'var(--color-text)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client */}
          {(res.guest || res.guest_email) && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                Client
              </div>
              <div className="card">
                <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {res.guest_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-envelope" style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 16 }} />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>{res.guest_email}</span>
                    </div>
                  )}
                  {res.guest_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-phone" style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 16 }} />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>{res.guest_phone}</span>
                    </div>
                  )}
                  {res.guest?.country && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-flag" style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 16 }} />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>{res.guest.country}</span>
                    </div>
                  )}
                  {res.guest?.loyalty_level && res.guest.loyalty_level !== 'Standard' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-star" style={{ fontSize: 12, color: '#F59E0B', width: 16 }} />
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#F59E0B' }}>{res.guest.loyalty_level}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {(res.notes || res.special_requests) && (
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                Notes
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                {res.notes ?? res.special_requests}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }}>
            <i className="fas fa-file-invoice" /> Facture
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }}>
            <i className="fas fa-envelope" /> Email
          </button>
          {res.status === 'confirmed' && (
            <button className="btn btn-primary" style={{ flex: 1 }}>
              <i className="fas fa-sign-in-alt" /> Check-in
            </button>
          )}
          {res.status === 'checked_in' && (
            <button className="btn btn-primary" style={{ flex: 1, background: '#F59E0B' }}>
              <i className="fas fa-sign-out-alt" /> Check-out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Module ────────────────────────────────────────────────────

const EMPTY_FILTERS: Filters = { search: '', status: 'all', source: 'all', period: 'all' };

interface Filters {
  search: string;
  status: ReservationStatus | 'all';
  source: ReservationSource | 'all';
  period: 'all' | 'today' | 'week' | 'month';
}

const ReservationsModule: React.FC = () => {
  const hotelId = useHotelId();
  const { reservations, isLoading, error, fetchReservations, cancelReservation, updateReservation } = useReservationStore();
  const { addToast } = useAppStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Reservation | null>(null);

  // Fetch initial
  useEffect(() => {
    fetchReservations(hotelId);
  }, [hotelId]);

  // Realtime subscription
  useEffect(() => {

    const channel = reservationService.subscribeToChanges(
      hotelId,
      (r: Reservation) => useReservationStore.getState()._onInsert(r),
      (r: Reservation) => useReservationStore.getState()._onUpdate(r),
      (id: string) => useReservationStore.getState()._onDelete(id),
    );
    return () => { channel.unsubscribe(); };
  }, [hotelId]);

  // Filtrage
  const filtered = reservations.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0];
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.source !== 'all' && r.source !== filters.source) return false;
    if (filters.period === 'today' && r.check_in !== today) return false;
    if (filters.period === 'week' && (r.check_in < today || r.check_in > weekEnd)) return false;
    if (filters.period === 'month' && (r.check_in < today || r.check_in > monthEnd)) return false;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        (r.guest_name ?? '').toLowerCase().includes(q) ||
        (r.guest_email ?? '').toLowerCase().includes(q) ||
        (r.reference ?? '').toLowerCase().includes(q) ||
        (r.room_number ?? '').includes(q)
      );
    }
    return true;
  });

  // Actions
  const handleAction = async (action: 'checkin' | 'checkout' | 'cancel' | 'view', res: Reservation) => {
    if (action === 'view') { setSelected(res); return; }
    if (action === 'cancel') { setConfirmCancel(res); return; }

    try {
      
      if (action === 'checkin') {
        await reservationService.checkIn(res.id, res.room_id!);
        eventBus.emit('checkin:completed', { reservationId: res.id, roomId: res.room_id! });
        addToast(`Check-in effectué — ${res.guest_name}`, 'success');
      } else if (action === 'checkout') {
        await reservationService.checkOut(res.id, res.room_id!);
        eventBus.emit('checkout:completed', { reservationId: res.id, invoiceId: '', roomId: res.room_id! });
        addToast(`Check-out effectué — ${res.guest_name}`, 'success');
      }
      fetchReservations(hotelId);
    } catch (e: any) {
      addToast(`Erreur : ${e.message}`, 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancel) return;
    try {
      await cancelReservation(confirmCancel.id);
      addToast(`Réservation annulée — ${confirmCancel.guest_name}`, 'warning');
      setConfirmCancel(null);
    } catch (e: any) {
      addToast(`Erreur : ${e.message}`, 'error');
    }
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">
            <i className="fas fa-bookmark" style={{ color: 'var(--color-primary)', marginRight: 10 }} />
            Réservations
          </div>
          <div className="page-subtitle">
            Folkestone Opéra · {reservations.length} réservation{reservations.length > 1 ? 's' : ''} au total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => fetchReservations(hotelId)}>
            <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`} />
            Actualiser
          </button>
          <button className="btn btn-ghost">
            <i className="fas fa-file-export" />
            Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <KPIs reservations={reservations} />

      {/* Filters + Table */}
      <div className="card">
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <Toolbar filters={filters} onChange={setFilters} total={filtered.length} onNew={() => {}} />
        </div>

        {/* États */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 24, color: 'var(--color-primary)', marginBottom: 12, display: 'block' }} />
            Chargement des réservations...
          </div>
        )}

        {error && !isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-danger)' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
            Erreur de connexion Supabase
            <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 4, color: 'var(--color-text-muted)' }}>{error}</div>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <i className="fas fa-search" style={{ fontSize: 32, color: 'var(--color-primary-light)', marginBottom: 12, display: 'block' }} />
            Aucune réservation trouvée
            {filters.search && <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 4 }}>pour « {filters.search} »</div>}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="table-container" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--color-border)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Chambre</th>
                  <th>Dates</th>
                  <th>Montant</th>
                  <th>Canal</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <ReservationRow key={r.id} res={r} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && <DetailPanel res={selected} onClose={() => setSelected(null)} />}

      {/* Confirm Cancel Modal */}
      {confirmCancel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setConfirmCancel(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{
            position: 'relative', background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            width: 400, boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: 22, color: '#EF4444' }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>
                Annuler la réservation ?
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {confirmCancel.guest_name} — {confirmCancel.room_number} — {fmtDate(confirmCancel.check_in)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmCancel(null)}>
                Annuler
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirmCancel}>
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsModule;
