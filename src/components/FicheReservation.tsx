import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reservation } from '../store/reservationStore';

// ═══════════════════════════════════════════════════════════════════════════
// FLOWTYM — FICHE RÉSERVATION COMPLÈTE
// 7 onglets : Réservation · Facturation · Cardex · Incidents · Objets Oubliés
//             Avis · Fidélité ÉLITE STAY
// ═══════════════════════════════════════════════════════════════════════════

// ─── PROGRAMME FIDÉLITÉ — ÉLITE STAY ─────────────────────────────────────────
// Inspiré de Marriott Bonvoy · Accor Live Limitless · IHG One Rewards
// Règle : 10 points par Euro dépensé
// Conversion : 1 000 pts = 10 € de remise (taux 1%)
//
// Paliers :
// Bronze  : 0 – 4 999 pts   (membre)
// Silver  : 5 000 – 14 999  (après 1 séjour + 500 € dépensés)
// Gold    : 15 000 – 49 999  (fidèle récurrent)
// Platinum: ≥ 50 000          (VIP absolu — surclassement automatique)
//
// Avantages par palier :
// Bronze  : accumulation de base x1
// Silver  : bonus multiplicateur x1.25, late checkout 13h
// Gold    : bonus x1.5, surclassement si dispo, breakfast offert 1×/séjour
// Platinum: bonus x2, surclassement garanti, welcome amenity, lounge access

export interface EliteStayAccount {
  memberId: string;          // ES-XXXXX
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPoints: number;       // cumul total tous temps
  availablePoints: number;   // points utilisables (non dépensés)
  lifetimeSpend: number;     // CA total depuis l'inscription en €
  memberSince: string;       // ISO date
  staysCount: number;        // nombre de séjours
  nightsCount: number;       // nombre de nuits cumulées
  transactions: LoyaltyTransaction[];
  redemptions: LoyaltyRedemption[];
}

export interface LoyaltyTransaction {
  id: string;
  date: string;
  type: 'earn' | 'bonus' | 'expire' | 'adjustment';
  points: number;
  description: string;
  reservationId?: string;
  amount?: number;           // montant €  ayant généré les points
}

export interface LoyaltyRedemption {
  id: string;
  date: string;
  pointsUsed: number;
  amountDiscount: number;   // remise en € obtenue
  reservationId: string;
  status: 'used' | 'pending' | 'cancelled';
}

// Incidents
export interface Incident {
  id: string;
  date: string;
  time: string;
  category: 'bruit' | 'proprete' | 'technique' | 'service' | 'securite' | 'autre';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolvedAt?: string;
  resolvedBy?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  guestNotified: boolean;
  compensation?: string;
}

// Objets oubliés
export interface LostItem {
  id: string;
  foundDate: string;
  foundLocation: string;
  description: string;
  category: 'vetement' | 'electronique' | 'document' | 'bijou' | 'autre';
  status: 'found' | 'claimed' | 'shipped' | 'donated' | 'disposed';
  claimedAt?: string;
  shippedAt?: string;
  trackingNumber?: string;
  photo?: string;
}

// Avis
export interface GuestReview {
  id: string;
  date: string;
  source: 'direct' | 'tripadvisor' | 'booking' | 'google' | 'expedia';
  overallScore: number;     // 1–10
  cleanliness?: number;
  comfort?: number;
  location?: number;
  service?: number;
  valueForMoney?: number;
  comment: string;
  response?: string;
  responseDate?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Cardex
export interface CardexEntry {
  reservationId: string;
  checkIn: string;
  checkOut: string;
  room: string;
  nights: number;
  amount: number;
  canal: string;
  status: string;
  notes?: string;
  documents?: string[];
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const POINTS_PER_EURO = 10;
const POINTS_TO_EURO = 1000;   // 1000 pts = 10 €  → taux 1%
const EURO_VALUE_PER_1000 = 10;

const TIER_CONFIG = {
  bronze:   { label: 'Bronze',   color: '#CD7F32', bg: '#FDF4E8', min: 0,     max: 4999,  multiplier: 1.0,  icon: '🥉' },
  silver:   { label: 'Silver',   color: '#94A3B8', bg: '#F8FAFC', min: 5000,  max: 14999, multiplier: 1.25, icon: '🥈' },
  gold:     { label: 'Gold',     color: '#F59E0B', bg: '#FFFBEB', min: 15000, max: 49999, multiplier: 1.5,  icon: '🥇' },
  platinum: { label: 'Platinum', color: '#8B5CF6', bg: '#EDE9FE', min: 50000, max: Infinity, multiplier: 2.0, icon: '💎' },
};

const TIER_BENEFITS: Record<string, string[]> = {
  bronze:   ['Accumulation 10 pts/€', 'Accès app membre', 'Newsletter offres exclusives'],
  silver:   ['Bonus x1.25 sur les points', 'Late checkout 13h00 (selon dispo)', 'Offres membre exclusives'],
  gold:     ['Bonus x1.5 sur les points', 'Surclassement si disponible', 'Petit-déjeuner offert 1×/séjour', 'Late checkout 14h00'],
  platinum: ['Bonus x2 sur les points', 'Surclassement garanti', 'Welcome amenity à l\'arrivée', 'Accès lounge', 'Butler service'],
};

const getTier = (pts: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (pts >= 50000) return 'platinum';
  if (pts >= 15000) return 'gold';
  if (pts >= 5000)  return 'silver';
  return 'bronze';
};

const calcEarnedPoints = (amountEur: number, tier: string): number =>
  Math.floor(amountEur * POINTS_PER_EURO * (TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.multiplier || 1));

const calcRedeemValue = (points: number): number =>
  Math.floor(points / POINTS_TO_EURO) * EURO_VALUE_PER_1000;

const uid = () => Math.random().toString(36).slice(2, 9);
const TODAY = new Date().toISOString().split('T')[0];
const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR');
const fmtEuro = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const buildMockEliteStay = (reservations: Reservation[], clientId?: number): EliteStayAccount => {
  const clientResas = reservations.filter(r => !clientId || r.clientId === clientId);
  const totalSpend = clientResas.reduce((s, r) => s + (r.montant || 0), 0);
  const totalNights = clientResas.reduce((s, r) => s + (r.nights || 0), 0);
  const earnedPts = Math.floor(totalSpend * POINTS_PER_EURO * 1.25); // silver
  const tier = getTier(earnedPts);
  const memberId = `ES-${String(clientId || 1).padStart(5, '0')}`;

  const transactions: LoyaltyTransaction[] = clientResas.flatMap(r => [
    {
      id: uid(), date: r.checkin, type: 'earn' as const,
      points: Math.floor((r.montant || 0) * POINTS_PER_EURO),
      description: `Séjour — Ch. ${r.room} — ${r.nights} nuit(s)`,
      reservationId: r.id, amount: r.montant || 0,
    },
    ...(r.montant > 200 ? [{
      id: uid(), date: r.checkout, type: 'bonus' as const,
      points: Math.floor((r.montant || 0) * POINTS_PER_EURO * 0.25),
      description: `Bonus Silver ×1.25 — ${r.id}`,
      reservationId: r.id,
    }] : []),
  ]);

  return {
    memberId, tier, totalPoints: earnedPts, availablePoints: Math.floor(earnedPts * 0.8),
    lifetimeSpend: totalSpend, memberSince: '2024-01-15',
    staysCount: clientResas.length, nightsCount: totalNights, transactions,
    redemptions: [{
      id: uid(), date: '2025-12-10', pointsUsed: 5000, amountDiscount: 50,
      reservationId: clientResas[0]?.id || 'RES-001', status: 'used',
    }],
  };
};

const MOCK_INCIDENTS: Incident[] = [
  { id: uid(), date: TODAY, time: '14:30', category: 'technique', severity: 'medium',
    description: 'Climatisation chambre insuffisante — température maintenue à 26°C malgré réglage', status: 'in_progress', guestNotified: true, resolvedBy: 'Maintenance' },
  { id: uid(), date: '2026-04-20', time: '22:15', category: 'bruit', severity: 'low',
    description: 'Nuisances sonores signalées — chambre voisine', status: 'resolved', guestNotified: true,
    resolvedAt: '2026-04-20T22:30:00', compensation: 'Coupes de champagne offertes' },
];

const MOCK_LOST_ITEMS: LostItem[] = [
  { id: uid(), foundDate: TODAY, foundLocation: 'Chambre 103', description: 'Chargeur iPhone blanc + câble', category: 'electronique', status: 'found' },
  { id: uid(), foundDate: '2026-04-18', foundLocation: 'Restaurant', description: 'Veste bleue Zara, taille M', category: 'vetement', status: 'claimed', claimedAt: '2026-04-19' },
];

const MOCK_REVIEWS: GuestReview[] = [
  { id: uid(), date: '2026-03-28', source: 'direct', overallScore: 9, cleanliness: 9, comfort: 8, location: 10, service: 9, valueForMoney: 8,
    comment: 'Excellent séjour, personnel aux petits soins. La suite panoramique valait largement l\'investissement.',
    response: 'Merci pour votre confiance. Nous espérons vous accueillir à nouveau très prochainement. À bientôt !',
    responseDate: '2026-03-29', sentiment: 'positive' },
  { id: uid(), date: '2025-12-15', source: 'booking', overallScore: 7, cleanliness: 8, comfort: 7, service: 7,
    comment: 'Bon séjour dans l\'ensemble. Climatisation un peu bruyante la nuit.',
    sentiment: 'neutral' },
];

// ─── STYLES PARTAGÉS ─────────────────────────────────────────────────────────
const CARD = { background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' } as const;
const LABEL = { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 4, display: 'block' };
const VALUE = { fontSize: 13, fontWeight: 600, color: '#1E293B' };
const FIELD = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#F8FAFC', color: '#334155' } as const;
const BTN = (variant: 'primary' | 'ghost' | 'danger') => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
  borderRadius: 10, border: variant === 'ghost' ? '1px solid #E2E8F0' : 'none',
  background: variant === 'primary' ? 'linear-gradient(135deg,#8B5CF6,#6D28D9)' : variant === 'danger' ? '#FEF2F2' : 'white',
  color: variant === 'primary' ? 'white' : variant === 'danger' ? '#DC2626' : '#64748B',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  boxShadow: variant === 'primary' ? '0 3px 10px rgba(139,92,246,.25)' : 'none',
} as const);

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Ico = {
  res:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  bill:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  cardex:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  incident:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  lost:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  review:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  loyalty: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  close:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ─── ONGLET 1 : RÉSERVATION ───────────────────────────────────────────────────
const TabReservation: React.FC<{ res: Reservation }> = ({ res }) => {
  const statusColors: Record<string, { label: string; color: string; bg: string }> = {
    confirmed:    { label: 'Confirmée',    color: '#2563EB', bg: '#EFF6FF' },
    pending:      { label: 'En attente',   color: '#D97706', bg: '#FFF7ED' },
    checked_in:   { label: 'En séjour',    color: '#059669', bg: '#ECFDF5' },
    checked_out:  { label: 'Départ',       color: '#64748B', bg: '#F8FAFC' },
    cancelled:    { label: 'Annulée',      color: '#DC2626', bg: '#FEF2F2' },
    no_show:      { label: 'No-Show',      color: '#9F1239', bg: '#FFF1F2' },
  };
  const st = statusColors[res.status] || statusColors.confirmed;

  const rows = [
    { label: 'N° réservation', value: res.id },
    { label: 'Client',         value: res.guestName || '—' },
    { label: 'Email',          value: res.email || '—' },
    { label: 'Téléphone',      value: res.phone || '—' },
    { label: 'Nationalité',    value: res.nationality || '—' },
    { label: 'Chambre',        value: `Ch. ${res.room}` },
    { label: 'Arrivée',        value: fmtDate(res.checkin) },
    { label: 'Départ',         value: fmtDate(res.checkout) },
    { label: 'Durée',          value: `${res.nights} nuit(s)` },
    { label: 'Canal',          value: res.canal },
    { label: 'Montant TTC',    value: fmtEuro(res.montant) },
    { label: 'Solde restant',  value: fmtEuro(res.solde), highlight: res.solde > 0 },
    { label: 'Mode de paiement', value: res.paymentMode || '—' },
    { label: 'Statut paiement', value: res.paymentStatus || '—' },
    { label: 'Garantie',       value: res.guaranteeType || '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, background: st.bg, color: st.color }}>
          ● {st.label}
        </span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>Créée le {fmtDate(TODAY)}</span>
      </div>

      {/* Grille 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ ...CARD, padding: '12px 16px' }}>
            <span style={LABEL}>{r.label}</span>
            <span style={{ ...VALUE, color: r.highlight ? '#DC2626' : '#1E293B', fontWeight: r.highlight ? 800 : 600 }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={CARD}>
        <span style={LABEL}>Notes internes</span>
        <textarea
          defaultValue={res.notes || ''}
          placeholder="Ajouter une note interne..."
          style={{ ...FIELD, resize: 'vertical', minHeight: 80, width: '100%' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button style={BTN('primary')}>
          {Ico.check} Confirmer le séjour
        </button>
        <button style={BTN('ghost')}>
          {Ico.edit} Modifier
        </button>
        <button style={BTN('danger')}>
          {Ico.close} Annuler la réservation
        </button>
      </div>
    </div>
  );
};

// ─── ONGLET 2 : FACTURATION ───────────────────────────────────────────────────
const TabFacturation: React.FC<{ res: Reservation }> = ({ res }) => {
  const nightRate = res.nights > 0 ? res.montant / res.nights : res.montant;
  const htRate = nightRate / 1.10;
  const tvaRate = nightRate - htRate;
  const totalHT = htRate * res.nights;
  const totalTVA = tvaRate * res.nights;
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmt, setPayAmt] = useState(res.solde);
  const [payMethod, setPayMethod] = useState('card');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Récapitulatif financier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total HT', value: fmtEuro(totalHT), color: '#64748B' },
          { label: 'TVA (10%)', value: fmtEuro(totalTVA), color: '#64748B' },
          { label: 'Total TTC', value: fmtEuro(res.montant), color: '#8B5CF6' },
          { label: 'Solde', value: fmtEuro(res.solde), color: res.solde > 0 ? '#DC2626' : '#059669' },
        ].map((k, i) => (
          <div key={i} style={{ ...CARD, textAlign: 'center' as const }}>
            <span style={LABEL}>{k.label}</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: 'monospace' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Lignes de facturation */}
      <div style={CARD}>
        <span style={{ ...LABEL, marginBottom: 12 }}>Lignes de facturation</span>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#FAFBFF' }}>
              {['Date', 'Description', 'Qté', 'PU HT', 'TVA', 'Total TTC'].map((h, i) => (
                <th key={i} style={{ padding: '8px 12px', textAlign: i > 1 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: res.nights }, (_, i) => {
              const d = new Date(res.checkin + 'T00:00:00');
              d.setDate(d.getDate() + i);
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '8px 12px', color: '#64748B', fontSize: 11 }}>{fmtDate(d.toISOString().split('T')[0])}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>Nuitée Ch. {res.room}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>1</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtEuro(htRate)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748B' }}>10%</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtEuro(nightRate)}</td>
                </tr>
              );
            })}
            <tr style={{ background: '#F5F3FF', borderTop: '2px solid #E2E8F0' }}>
              <td colSpan={5} style={{ padding: '10px 12px', fontWeight: 700, fontSize: 12 }}>TOTAL</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: 14, fontFamily: 'monospace', color: '#8B5CF6' }}>{fmtEuro(res.montant)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Encaissement */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={LABEL}>Paiements enregistrés</span>
          <button onClick={() => setShowPayForm(!showPayForm)} style={BTN('primary')}>
            {Ico.plus} Encaisser
          </button>
        </div>
        {res.solde < res.montant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ECFDF5', borderRadius: 10, marginBottom: 12, fontSize: 12, color: '#059669', fontWeight: 600 }}>
            {Ico.check} Paiement reçu : {fmtEuro(res.montant - res.solde)}
          </div>
        )}
        {res.solde > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, marginBottom: 12, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
            Solde restant : {fmtEuro(res.solde)}
          </div>
        )}
        <AnimatePresence>
          {showPayForm && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, border: '1px solid #BBF7D0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <span style={LABEL}>Montant €</span>
                  <input type="number" value={payAmt} onChange={e => setPayAmt(+e.target.value)} style={FIELD} />
                </div>
                <div>
                  <span style={LABEL}>Mode</span>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={FIELD}>
                    <option value="card">💳 Carte bancaire</option>
                    <option value="cash">💵 Espèces</option>
                    <option value="transfer">🏦 Virement</option>
                    <option value="ota">🌐 OTA (prépayé)</option>
                    <option value="check">📄 Chèque</option>
                  </select>
                </div>
                <div>
                  <span style={LABEL}>Référence</span>
                  <input type="text" placeholder="N° transaction..." style={FIELD} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowPayForm(false)} style={BTN('ghost')}>Annuler</button>
                <button onClick={() => { setShowPayForm(false); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Paiement enregistré · ${fmtEuro(payAmt)}` } })); }} style={BTN('primary')}>
                  Valider l'encaissement
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bouton PDF */}
      <button style={{ ...BTN('ghost'), alignSelf: 'flex-start' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimer la facture
      </button>
    </div>
  );
};

// ─── ONGLET 3 : CARDEX ────────────────────────────────────────────────────────
const TabCardex: React.FC<{ res: Reservation; allReservations: Reservation[] }> = ({ res, allReservations }) => {
  const guestResas = allReservations.filter(r =>
    r.guestName === res.guestName || (res.clientId && r.clientId === res.clientId)
  ).sort((a, b) => b.checkin.localeCompare(a.checkin));

  const totalNights = guestResas.reduce((s, r) => s + r.nights, 0);
  const totalSpend  = guestResas.reduce((s, r) => s + r.montant, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Séjours', value: guestResas.length, color: '#8B5CF6', icon: '🏨' },
          { label: 'Nuits totales', value: totalNights, color: '#2563EB', icon: '🌙' },
          { label: 'CA total', value: fmtEuro(totalSpend), color: '#059669', icon: '💶' },
          { label: 'Dépense moy./séjour', value: fmtEuro(guestResas.length ? totalSpend / guestResas.length : 0), color: '#D97706', icon: '📊' },
        ].map((k, i) => (
          <div key={i} style={{ ...CARD, textAlign: 'center' as const }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
            <span style={LABEL}>{k.label}</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: 'monospace' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Historique des séjours */}
      <div style={CARD}>
        <span style={{ ...LABEL, marginBottom: 12 }}>Historique complet des séjours</span>
        {guestResas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#CBD5E1', fontSize: 12 }}>Aucun séjour antérieur</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#FAFBFF' }}>
                {['Réservation', 'Arrivée', 'Départ', 'Chambre', 'Nuits', 'Canal', 'Montant', 'Statut'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: i > 3 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guestResas.map(r => {
                const isCurrent = r.id === res.id;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F8FAFC', background: isCurrent ? '#F5F3FF' : 'white' }}>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: '#5B21B6' }}>
                      {r.id} {isCurrent && <span style={{ fontSize: 9, background: '#EDE9FE', color: '#5B21B6', padding: '1px 6px', borderRadius: 100, marginLeft: 4 }}>EN COURS</span>}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{fmtDate(r.checkin)}</td>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{fmtDate(r.checkout)}</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>Ch. {r.room}</span></td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.nights}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#64748B' }}>{r.canal}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtEuro(r.montant)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: r.status === 'checked_out' ? '#ECFDF5' : r.status === 'checked_in' ? '#EFF6FF' : '#F8FAFC', color: r.status === 'checked_out' ? '#059669' : r.status === 'checked_in' ? '#2563EB' : '#64748B', fontWeight: 700 }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Préférences client */}
      <div style={CARD}>
        <span style={{ ...LABEL, marginBottom: 12 }}>Préférences & remarques mémorisées</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Étage préféré', value: 'Étage élevé, vue dégagée' },
            { label: 'Type de lit', value: 'Grand lit double' },
            { label: 'Régime alimentaire', value: 'Sans gluten' },
            { label: 'Heure d\'arrivée habituelle', value: '14h–16h' },
          ].map((p, i) => (
            <div key={i} style={{ background: '#FAFBFF', borderRadius: 10, padding: '10px 14px', border: '1px solid #F1F5F9' }}>
              <span style={LABEL}>{p.label}</span>
              <span style={{ ...VALUE, fontSize: 12 }}>{p.value}</span>
            </div>
          ))}
        </div>
        <textarea placeholder="Ajouter une préférence ou note client..." style={{ ...FIELD, marginTop: 12, resize: 'vertical', minHeight: 60 }} />
      </div>
    </div>
  );
};

// ─── ONGLET 4 : INCIDENTS ─────────────────────────────────────────────────────
const TabIncidents: React.FC<{ res: Reservation }> = ({ res }) => {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ category: 'technique', severity: 'medium', description: '', guestNotified: false });

  const SEVERITY = {
    low:      { label: 'Faible',   color: '#059669', bg: '#ECFDF5' },
    medium:   { label: 'Modéré',   color: '#D97706', bg: '#FFF7ED' },
    high:     { label: 'Élevé',    color: '#DC2626', bg: '#FEF2F2' },
    critical: { label: 'Critique', color: '#7F1D1D', bg: '#FEF2F2' },
  };
  const STATUS = {
    open:        { label: 'Ouvert',        color: '#DC2626', bg: '#FEF2F2' },
    in_progress: { label: 'En cours',      color: '#D97706', bg: '#FFF7ED' },
    resolved:    { label: 'Résolu',        color: '#059669', bg: '#ECFDF5' },
    closed:      { label: 'Clôturé',       color: '#64748B', bg: '#F8FAFC' },
  };

  const addIncident = () => {
    if (!form.description) return;
    const inc: Incident = { id: uid(), date: TODAY, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), ...form as any, status: 'open' };
    setIncidents(prev => [inc, ...prev]);
    setNewOpen(false);
    setForm({ category: 'technique', severity: 'medium', description: '', guestNotified: false });
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Incident signalé · Notification équipe envoyée' } }));
  };

  const resolve = (id: string) => setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved', resolvedAt: new Date().toISOString() } : i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Incidents — Ch. {res.room}</span>
          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 12 }}>{incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length} en cours</span>
        </div>
        <button onClick={() => setNewOpen(true)} style={BTN('primary')}>{Ico.plus} Signaler incident</button>
      </div>

      <AnimatePresence>
        {newOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: '#FFF7ED', borderRadius: 14, padding: 18, border: '1px solid #FED7AA' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 14 }}>Signaler un nouvel incident</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <span style={LABEL}>Catégorie</span>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={FIELD}>
                  <option value="bruit">🔊 Bruit</option>
                  <option value="proprete">🧹 Propreté</option>
                  <option value="technique">🔧 Technique</option>
                  <option value="service">💁 Service</option>
                  <option value="securite">🔒 Sécurité</option>
                  <option value="autre">📋 Autre</option>
                </select>
              </div>
              <div>
                <span style={LABEL}>Sévérité</span>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} style={FIELD}>
                  <option value="low">Faible</option>
                  <option value="medium">Modéré</option>
                  <option value="high">Élevé</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de l'incident..." style={{ ...FIELD, resize: 'vertical', minHeight: 80, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setNewOpen(false)} style={BTN('ghost')}>Annuler</button>
              <button onClick={addIncident} style={BTN('primary')}>Enregistrer l'incident</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {incidents.map(inc => {
          const sv = SEVERITY[inc.severity as keyof typeof SEVERITY];
          const st = STATUS[inc.status as keyof typeof STATUS];
          return (
            <div key={inc.id} style={{ ...CARD, borderLeft: `4px solid ${sv.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: sv.bg, color: sv.color }}>{sv.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: st.bg, color: st.color }}>{st.label}</span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{inc.date} à {inc.time}</span>
                    {inc.guestNotified && <span style={{ fontSize: 9, background: '#EFF6FF', color: '#2563EB', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>✓ Client notifié</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>{inc.description}</div>
                  {inc.compensation && (
                    <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>🎁 Compensation : {inc.compensation}</div>
                  )}
                  {inc.resolvedBy && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Résolu par {inc.resolvedBy}</div>}
                </div>
                {inc.status !== 'resolved' && inc.status !== 'closed' && (
                  <button onClick={() => resolve(inc.id)} style={{ ...BTN('ghost'), fontSize: 11, padding: '6px 12px', flexShrink: 0 }}>
                    {Ico.check} Résoudre
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {incidents.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#CBD5E1', fontSize: 12 }}>✓ Aucun incident signalé pour ce séjour</div>
        )}
      </div>
    </div>
  );
};

// ─── ONGLET 5 : OBJETS OUBLIÉS ────────────────────────────────────────────────
const TabLostItems: React.FC = () => {
  const [items, setItems] = useState<LostItem[]>(MOCK_LOST_ITEMS);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ description: '', foundLocation: '', category: 'autre' });

  const STATUS_LOST = {
    found:    { label: 'Trouvé',    color: '#D97706', bg: '#FFF7ED' },
    claimed:  { label: 'Réclamé',   color: '#2563EB', bg: '#EFF6FF' },
    shipped:  { label: 'Expédié',   color: '#8B5CF6', bg: '#EDE9FE' },
    donated:  { label: 'Don',       color: '#64748B', bg: '#F8FAFC' },
    disposed: { label: 'Détruit',   color: '#94A3B8', bg: '#F1F5F9' },
  };
  const CAT_ICONS: Record<string, string> = { vetement: '👕', electronique: '📱', document: '📄', bijou: '💍', autre: '📦' };

  const addItem = () => {
    if (!form.description) return;
    setItems(prev => [{ id: uid(), foundDate: TODAY, ...form as any, status: 'found' }, ...prev]);
    setNewOpen(false);
    setForm({ description: '', foundLocation: '', category: 'autre' });
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Objet oublié enregistré · En attente de réclamation' } }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Objets oubliés</span>
        <button onClick={() => setNewOpen(true)} style={BTN('primary')}>{Ico.plus} Déclarer un objet</button>
      </div>

      <AnimatePresence>
        {newOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: '#F0FDF4', borderRadius: 14, padding: 18, border: '1px solid #BBF7D0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <span style={LABEL}>Description</span>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Chargeur iPhone blanc..." style={FIELD} />
              </div>
              <div>
                <span style={LABEL}>Lieu trouvé</span>
                <input value={form.foundLocation} onChange={e => setForm(f => ({ ...f, foundLocation: e.target.value }))} placeholder="Chambre 103, Restaurant..." style={FIELD} />
              </div>
              <div>
                <span style={LABEL}>Catégorie</span>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={FIELD}>
                  <option value="vetement">👕 Vêtement</option>
                  <option value="electronique">📱 Électronique</option>
                  <option value="document">📄 Document</option>
                  <option value="bijou">💍 Bijou</option>
                  <option value="autre">📦 Autre</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setNewOpen(false)} style={BTN('ghost')}>Annuler</button>
              <button onClick={addItem} style={BTN('primary')}>Enregistrer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map(item => {
          const st = STATUS_LOST[item.status as keyof typeof STATUS_LOST];
          return (
            <div key={item.id} style={CARD}>
              <div style={{ display: 'flex', align: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{CAT_ICONS[item.category]}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{item.description}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Trouvé le {fmtDate(item.foundDate)} · {item.foundLocation}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
              </div>
              {item.status === 'found' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'claimed', claimedAt: TODAY } : i))}
                    style={{ ...BTN('ghost'), fontSize: 11, flex: 1 }}>✓ Réclamé</button>
                  <button style={{ ...BTN('ghost'), fontSize: 11, flex: 1 }}>📦 Expédier</button>
                </div>
              )}
              {item.claimedAt && <div style={{ fontSize: 10, color: '#059669', marginTop: 6 }}>Récupéré le {fmtDate(item.claimedAt)}</div>}
              {item.trackingNumber && <div style={{ fontSize: 10, color: '#8B5CF6', marginTop: 4 }}>📦 Suivi : {item.trackingNumber}</div>}
            </div>
          );
        })}
        {items.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#CBD5E1', fontSize: 12 }}>Aucun objet oublié déclaré pour ce séjour</div>
        )}
      </div>
    </div>
  );
};

// ─── ONGLET 6 : AVIS ─────────────────────────────────────────────────────────
const TabReviews: React.FC<{ res: Reservation }> = ({ res }) => {
  const [reviews, setReviews] = useState<GuestReview[]>(MOCK_REVIEWS);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    direct:      { label: 'Direct',       color: '#8B5CF6', bg: '#EDE9FE' },
    tripadvisor: { label: 'TripAdvisor',  color: '#00AF87', bg: '#ECFDF5' },
    booking:     { label: 'Booking.com',  color: '#2563EB', bg: '#EFF6FF' },
    google:      { label: 'Google',       color: '#DC2626', bg: '#FEF2F2' },
    expedia:     { label: 'Expedia',      color: '#D97706', bg: '#FFF7ED' },
  };

  const avgScore = reviews.length ? (reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length).toFixed(1) : '–';

  const Stars = ({ score }: { score: number }) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i < score ? '#F59E0B' : '#E2E8F0' }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginLeft: 6 }}>{score}/10</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Score moyen */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{avgScore}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{reviews.length} avis</div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Propreté', key: 'cleanliness' },
            { label: 'Confort', key: 'comfort' },
            { label: 'Localisation', key: 'location' },
            { label: 'Service', key: 'service' },
          ].map(c => {
            const avg = reviews.filter(r => (r as any)[c.key]).reduce((s, r) => s + ((r as any)[c.key] || 0), 0) / (reviews.filter(r => (r as any)[c.key]).length || 1);
            return (
              <div key={c.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginBottom: 3 }}>
                  <span>{c.label}</span><span style={{ fontWeight: 700 }}>{avg.toFixed(1)}</span>
                </div>
                <div style={{ height: 5, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${avg * 10}%`, background: avg >= 8 ? '#059669' : avg >= 6 ? '#F59E0B' : '#DC2626', borderRadius: 100 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des avis */}
      {reviews.map(r => {
        const src = SOURCE_CONFIG[r.source] || SOURCE_CONFIG.direct;
        return (
          <div key={r.id} style={{ ...CARD, borderLeft: `4px solid ${r.sentiment === 'positive' ? '#059669' : r.sentiment === 'negative' ? '#DC2626' : '#D97706'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: src.bg, color: src.color }}>{src.label}</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>{fmtDate(r.date)}</span>
              </div>
              <Stars score={r.overallScore} />
            </div>
            <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 10 }}>"{r.comment}"</p>
            {r.response ? (
              <div style={{ background: '#F5F3FF', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#5B21B6' }}>
                <span style={{ fontWeight: 700 }}>Réponse de l'hôtel ({fmtDate(r.responseDate!)})</span>
                <p style={{ marginTop: 4 }}>{r.response}</p>
              </div>
            ) : (
              replyOpen === r.id ? (
                <div>
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Répondre à cet avis..." style={{ ...FIELD, resize: 'vertical', minHeight: 60, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setReplyOpen(null)} style={BTN('ghost')}>Annuler</button>
                    <button onClick={() => {
                      setReviews(prev => prev.map(rv => rv.id === r.id ? { ...rv, response: replyText, responseDate: TODAY } : rv));
                      setReplyOpen(null); setReplyText('');
                      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Réponse publiée · Avis ' + src.label } }));
                    }} style={BTN('primary')}>Publier la réponse</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setReplyOpen(r.id); setReplyText(''); }} style={BTN('ghost')}>
                  Répondre à cet avis
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── ONGLET 7 : FIDÉLITÉ ÉLITE STAY ──────────────────────────────────────────
const TabLoyalty: React.FC<{ res: Reservation; allReservations: Reservation[] }> = ({ res, allReservations }) => {
  const account = useMemo(() => buildMockEliteStay(allReservations, res.clientId), [allReservations, res.clientId]);
  const tier = TIER_CONFIG[account.tier];
  const nextTier = account.tier === 'bronze' ? TIER_CONFIG.silver : account.tier === 'silver' ? TIER_CONFIG.gold : account.tier === 'gold' ? TIER_CONFIG.platinum : null;
  const ptsToNextTier = nextTier ? (nextTier.min - account.totalPoints) : 0;
  const progressPct = nextTier ? Math.min(100, ((account.totalPoints - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemPts, setRedeemPts] = useState(1000);
  const redeemValue = calcRedeemValue(redeemPts);
  const earnedThisStay = calcEarnedPoints(res.montant, account.tier);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* CARTE MEMBRE ÉLITE STAY */}
      <div style={{
        background: `linear-gradient(135deg, ${account.tier === 'platinum' ? '#2D1065, #1A1A3E' : account.tier === 'gold' ? '#78350F, #92400E' : account.tier === 'silver' ? '#1E293B, #334155' : '#3B1F6B, #1E3A5F'})`,
        borderRadius: 20, padding: '24px 28px', color: 'white', position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,.25)',
      }}>
        {/* Pattern de fond */}
        <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 4 }}>ÉLITE STAY</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '.03em' }}>
              {tier.icon} Carte {tier.label}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>N° membre</div>
            <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}>{account.memberId}</div>
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{res.guestName || 'Client'}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>
          Membre depuis {fmtDate(account.memberSince)} · {account.staysCount} séjours · {account.nightsCount} nuits
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Points disponibles</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: account.tier === 'gold' ? '#FCD34D' : 'white', lineHeight: 1.1 }}>
              {account.availablePoints.toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4, color: 'rgba(255,255,255,.5)' }}>pts</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
              = {fmtEuro(calcRedeemValue(account.availablePoints))} de remise utilisable
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Total cumulé</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{account.totalPoints.toLocaleString()} pts</div>
          </div>
        </div>
      </div>

      {/* Progression vers palier suivant */}
      {nextTier && (
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: '#1E293B' }}>
              {tier.icon} {tier.label} → {nextTier.icon} {nextTier.label}
            </span>
            <span style={{ color: nextTier.color, fontWeight: 700 }}>{ptsToNextTier.toLocaleString()} pts restants</span>
          </div>
          <div style={{ height: 8, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: .8, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`, borderRadius: 100 }} />
          </div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
            Encore {fmtEuro(ptsToNextTier / POINTS_PER_EURO)} de dépenses pour atteindre le niveau {nextTier.label}
          </div>
        </div>
      )}

      {/* KPIs fidélité */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'CA total', value: fmtEuro(account.lifetimeSpend), color: '#8B5CF6' },
          { label: 'Pts ce séjour', value: `+${earnedThisStay.toLocaleString()}`, color: '#059669' },
          { label: 'Valeur convertible', value: fmtEuro(calcRedeemValue(account.availablePoints)), color: '#F59E0B' },
          { label: 'Multiplicateur', value: `×${tier.multiplier.toFixed(2)}`, color: tier.color },
        ].map((k, i) => (
          <div key={i} style={{ ...CARD, textAlign: 'center' as const }}>
            <span style={LABEL}>{k.label}</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color, fontFamily: 'monospace' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Logique de conversion */}
      <div style={{ ...CARD, background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
        <span style={{ ...LABEL, color: '#5B21B6' }}>Comment ça marche — Programme ÉLITE STAY</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 10 }}>
          {[
            { title: 'Accumulation', desc: `${POINTS_PER_EURO} points par € dépensé`, sub: `Multiplié selon votre palier (×${tier.multiplier})`, icon: '💰' },
            { title: 'Conversion', desc: `1 000 pts = ${EURO_VALUE_PER_1000} €`, sub: 'Utilisable dès 1 000 pts — soit 1% de remise', icon: '🔄' },
            { title: 'Paliers', desc: 'Bronze → Silver → Gold → Platinum', sub: 'Bonus multiplicateur × avantages exclusifs', icon: '🏆' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #DDD6FE' }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#1E293B', marginBottom: 2 }}>{item.desc}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Avantages palier actuel */}
      <div style={CARD}>
        <span style={{ ...LABEL, marginBottom: 12 }}>Avantages {tier.icon} {tier.label}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TIER_BENEFITS[account.tier].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#334155' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: tier.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Ico.check}
              </div>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Utiliser les points */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Utiliser les points</span>
          <button onClick={() => setRedeemOpen(!redeemOpen)} style={BTN('primary')}>
            Utiliser {account.availablePoints.toLocaleString()} pts
          </button>
        </div>
        <AnimatePresence>
          {redeemOpen && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: '#F5F3FF', borderRadius: 12, padding: 16, border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <span style={LABEL}>Points à utiliser</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="range" min={1000} max={account.availablePoints} step={1000} value={redeemPts}
                      onChange={e => setRedeemPts(+e.target.value)}
                      style={{ flex: 1, accentColor: '#8B5CF6' }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8B5CF6', minWidth: 70 }}>{redeemPts.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 16px', border: '1px solid #DDD6FE', textAlign: 'center' as const }}>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>Remise obtenue</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>{fmtEuro(redeemValue)}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                    {Math.floor(redeemPts / POINTS_TO_EURO)} × {EURO_VALUE_PER_1000} €
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setRedeemOpen(false)} style={BTN('ghost')}>Annuler</button>
                <button onClick={() => {
                  setRedeemOpen(false);
                  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Points utilisés · ${redeemPts.toLocaleString()} pts = ${fmtEuro(redeemValue)} déduits` } }));
                }} style={BTN('primary')}>
                  Appliquer la remise de {fmtEuro(redeemValue)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Journal des transactions */}
      <div style={CARD}>
        <span style={{ ...LABEL, marginBottom: 12 }}>Historique des points</span>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#FAFBFF' }}>
              {['Date', 'Type', 'Description', 'Points', 'Montant'].map((h, i) => (
                <th key={i} style={{ padding: '8px 12px', textAlign: i > 2 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...account.transactions].slice(0, 8).map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '8px 12px', color: '#64748B', fontSize: 11 }}>{fmtDate(t.date)}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: t.type === 'earn' ? '#ECFDF5' : t.type === 'bonus' ? '#EDE9FE' : '#FEF2F2', color: t.type === 'earn' ? '#059669' : t.type === 'bonus' ? '#8B5CF6' : '#DC2626', fontWeight: 700 }}>
                    {t.type === 'earn' ? '+ Gain' : t.type === 'bonus' ? '★ Bonus' : '– Expiration'}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontSize: 11 }}>{t.description}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: t.points > 0 ? '#059669' : '#DC2626' }}>
                  {t.points > 0 ? '+' : ''}{t.points.toLocaleString()} pts
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748B', fontSize: 11 }}>
                  {t.amount ? fmtEuro(t.amount) : '—'}
                </td>
              </tr>
            ))}
            {/* Ligne ce séjour */}
            <tr style={{ background: '#F0FDF4', borderTop: '2px dashed #BBF7D0' }}>
              <td style={{ padding: '8px 12px', color: '#059669', fontSize: 11, fontWeight: 700 }}>{fmtDate(res.checkin)}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: '#ECFDF5', color: '#059669', fontWeight: 700 }}>+ Ce séjour</span>
              </td>
              <td style={{ padding: '8px 12px', fontSize: 11, color: '#059669', fontWeight: 600 }}>Séjour en cours · Ch. {res.room}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#059669' }}>+{earnedThisStay.toLocaleString()} pts</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{fmtEuro(res.montant)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL : FICHE RÉSERVATION ─────────────────────────────────
interface FicheReservationProps {
  reservation: Reservation;
  allReservations?: Reservation[];
  onClose: () => void;
  onUpdate?: (updated: Reservation) => void;
}

const TABS = [
  { id: 'reservation', label: 'Réservation',    icon: Ico.res     },
  { id: 'facturation', label: 'Facturation',     icon: Ico.bill    },
  { id: 'cardex',      label: 'Cardex',          icon: Ico.cardex  },
  { id: 'incidents',   label: 'Incidents',       icon: Ico.incident },
  { id: 'lost',        label: 'Objets oubliés',  icon: Ico.lost    },
  { id: 'reviews',     label: 'Avis',            icon: Ico.review  },
  { id: 'loyalty',     label: 'Élite Stay',      icon: Ico.loyalty },
];

export const FicheReservation: React.FC<FicheReservationProps> = ({
  reservation, allReservations = [], onClose, onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<string>('reservation');

  const statusColors: Record<string, { color: string; bg: string }> = {
    confirmed:   { color: '#2563EB', bg: '#EFF6FF' },
    pending:     { color: '#D97706', bg: '#FFF7ED' },
    checked_in:  { color: '#059669', bg: '#ECFDF5' },
    checked_out: { color: '#64748B', bg: '#F8FAFC' },
    cancelled:   { color: '#DC2626', bg: '#FEF2F2' },
    no_show:     { color: '#9F1239', bg: '#FFF1F2' },
  };
  const st = statusColors[reservation.status] || statusColors.confirmed;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: .96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .96, y: 20 }}
        style={{ width: '100%', maxWidth: 1100, maxHeight: '94vh', background: '#F8FAFC', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.3)' }}
      >
        {/* ── HEADER ── */}
        <div style={{ background: 'linear-gradient(135deg, #2D1065, #1A1A3E)', padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* Avatar initiales */}
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {(reservation.guestName || 'G').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          {/* Infos */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>{reservation.guestName || 'Client'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,.6)' }}>{reservation.id}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 100, background: st.bg, color: st.color }}>
                {reservation.status.replace('_', ' ')}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
                Ch. {reservation.room} · {fmtDate(reservation.checkin)} → {fmtDate(reservation.checkout)} · {reservation.nights} nuit(s)
              </span>
            </div>
          </div>
          {/* Montant */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: 'monospace' }}>{fmtEuro(reservation.montant)}</div>
            <div style={{ fontSize: 10, color: reservation.solde > 0 ? '#FCA5A5' : '#86EFAC', fontWeight: 600 }}>
              {reservation.solde > 0 ? `Solde : ${fmtEuro(reservation.solde)}` : '✓ Soldée'}
            </div>
          </div>
          {/* Fermer */}
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.12)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {Ico.close}
          </button>
        </div>

        {/* ── ONGLETS ── */}
        <div style={{ display: 'flex', gap: 0, background: 'white', borderBottom: '1px solid #F1F5F9', padding: '0 28px', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 16px', border: 'none', background: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
                borderBottom: activeTab === t.id ? '2.5px solid #8B5CF6' : '2.5px solid transparent',
                color: activeTab === t.id ? '#7C3AED' : '#94A3B8',
                transition: 'all .15s',
              }}>
              <span style={{ color: activeTab === t.id ? '#7C3AED' : '#CBD5E1' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTENU ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .15 }}>
              {activeTab === 'reservation' && <TabReservation res={reservation} />}
              {activeTab === 'facturation' && <TabFacturation res={reservation} />}
              {activeTab === 'cardex'      && <TabCardex res={reservation} allReservations={allReservations} />}
              {activeTab === 'incidents'   && <TabIncidents res={reservation} />}
              {activeTab === 'lost'        && <TabLostItems />}
              {activeTab === 'reviews'     && <TabReviews res={reservation} />}
              {activeTab === 'loyalty'     && <TabLoyalty res={reservation} allReservations={allReservations} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default FicheReservation;
