import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, TrendingDown, TrendingUp, Shield, AlertTriangle,
  BarChart2, Clock, Target, Users, Lock, ChevronDown,
  ChevronRight, Play, Pause, Settings, Info, CheckCircle2,
  ArrowUp, ArrowDown, Minus, Save, RotateCcw
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type RuleStatus = 'active' | 'paused' | 'draft';
type ActionType = 'price_down' | 'price_up' | 'open_sales' | 'close_sales' | 'set_mlos' | 'remove_mlos' | 'set_cta' | 'boost_ota' | 'close_promo';

interface RuleAction {
  type: ActionType;
  value?: number;
  label: string;
  color: string;
  icon: React.ReactNode;
}

interface Rule {
  id: string;
  order: number;
  name: string;
  shortName: string;
  description: string;
  category: 'securite' | 'marche' | 'pickup' | 'occupancy' | 'lead_time' | 'restrictions';
  icon: React.ReactNode;
  color: string;
  bg: string;
  status: RuleStatus;
  priority: 'critique' | 'haute' | 'normale';
  conditions: { label: string; operator: string; value: string; editable?: boolean; field?: string }[];
  actions: RuleAction[];
  triggered: number;
  lastTriggered?: string;
  impact: string;
  warning?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  securite:     { label: '1. Sécurité',         color: '#DC2626', bg: '#FEF2F2', icon: <Shield className="w-3 h-3" /> },
  marche:       { label: '2. Marché / Compset',  color: '#7C3AED', bg: '#EDE9FE', icon: <BarChart2 className="w-3 h-3" /> },
  pickup:       { label: '3. Pickup',            color: '#2563EB', bg: '#EFF6FF', icon: <Target className="w-3 h-3" /> },
  occupancy:    { label: '4. Occupation',        color: '#D97706', bg: '#FFF7ED', icon: <Users className="w-3 h-3" /> },
  lead_time:    { label: '5. Lead Time',         color: '#059669', bg: '#ECFDF5', icon: <Clock className="w-3 h-3" /> },
  restrictions: { label: '6. Restrictions',      color: '#64748B', bg: '#F8FAFC', icon: <Lock className="w-3 h-3" /> },
};

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  price_down:   <ArrowDown className="w-3 h-3" />,
  price_up:     <ArrowUp className="w-3 h-3" />,
  open_sales:   <CheckCircle2 className="w-3 h-3" />,
  close_sales:  <Lock className="w-3 h-3" />,
  set_mlos:     <Lock className="w-3 h-3" />,
  remove_mlos:  <CheckCircle2 className="w-3 h-3" />,
  set_cta:      <Lock className="w-3 h-3" />,
  boost_ota:    <TrendingUp className="w-3 h-3" />,
  close_promo:  <Lock className="w-3 h-3" />,
};

// ─── 10 règles ────────────────────────────────────────────────────────────────
const INITIAL_RULES: Rule[] = [
  {
    id: 'r10', order: 1, name: 'Filet de sécurité', shortName: 'Sécurité', priority: 'critique',
    category: 'securite',
    icon: <Shield className="w-5 h-5" />, color: '#DC2626', bg: '#FEF2F2',
    description: 'Garde-fou obligatoire : plafonne toutes les variations de prix à ±20%/jour et impose les bornes min/max.',
    status: 'active', triggered: 0,
    impact: 'Protège contre tout comportement aberrant du moteur de pricing.',
    warning: 'Cette règle doit toujours être active. Ne jamais la désactiver.',
    conditions: [
      { label: 'Toujours active', operator: '=', value: 'OUI' },
    ],
    actions: [
      { type: 'price_down', value: 20, label: 'MAX variation / jour = ±20%', color: '#DC2626', icon: <Shield className="w-3 h-3" /> },
      { type: 'price_up', label: 'Prix ≥ Prix minimum configuré', color: '#059669', icon: <ArrowUp className="w-3 h-3" /> },
      { type: 'price_down', label: 'Prix ≤ Prix maximum configuré', color: '#2563EB', icon: <ArrowDown className="w-3 h-3" /> },
    ],
  },
  {
    id: 'r5', order: 2, name: 'Alignement marché (anti-dérive)', shortName: 'Compset', priority: 'haute',
    category: 'marche',
    icon: <BarChart2 className="w-5 h-5" />, color: '#7C3AED', bg: '#EDE9FE',
    description: 'Compare ton prix au compset en temps réel. Évite de dériver trop haut ou trop bas par rapport au marché.',
    status: 'active', triggered: 12, lastTriggered: 'Il y a 2h',
    impact: 'Maintient la compétitivité sans sacrifier le RevPAR.',
    conditions: [
      { label: 'Ton prix', operator: '>', value: 'Compset +15%', editable: true, field: 'above_threshold' },
      { label: 'OU Ton prix', operator: '<', value: 'Compset -15%', editable: true, field: 'below_threshold' },
    ],
    actions: [
      { type: 'price_down', value: 5, label: 'Si trop haut → Baisser -5%', color: '#DC2626', icon: ACTION_ICONS.price_down },
      { type: 'price_up', value: 5, label: 'Si trop bas → Monter +5%', color: '#059669', icon: ACTION_ICONS.price_up },
    ],
  },
  {
    id: 'r6', order: 3, name: 'Pickup lent = action', shortName: 'Pickup lent', priority: 'haute',
    category: 'pickup',
    icon: <TrendingDown className="w-5 h-5" />, color: '#2563EB', bg: '#EFF6FF',
    description: "Détecte un rythme de réservation inférieur à l'historique N-1 et réagit avant qu'il soit trop tard.",
    status: 'active', triggered: 5, lastTriggered: 'Hier',
    impact: "Évite de réaliser trop tard que la semaine se remplit mal.",
    conditions: [
      { label: 'Pickup actuel', operator: '<', value: 'Historique N-1 -20%', editable: true, field: 'pickup_threshold' },
    ],
    actions: [
      { type: 'price_down', value: 10, label: 'Baisser prix -10%', color: '#DC2626', icon: ACTION_ICONS.price_down },
      { type: 'boost_ota', label: 'Booster visibilité OTA', color: '#7C3AED', icon: ACTION_ICONS.boost_ota },
    ],
  },
  {
    id: 'r7', order: 4, name: 'Pickup rapide = frein', shortName: 'Pickup rapide', priority: 'haute',
    category: 'pickup',
    icon: <TrendingUp className="w-5 h-5" />, color: '#2563EB', bg: '#EFF6FF',
    description: 'Détecte un rythme de réservation anormalement rapide. Signal que tu es sous-pricé ou que la demande est forte.',
    status: 'active', triggered: 3, lastTriggered: 'Il y a 3j',
    impact: "Évite de vendre trop vite à prix bas = sous-pricing.",
    conditions: [
      { label: 'Pickup actuel', operator: '>', value: 'Historique N-1 +20%', editable: true, field: 'pickup_up_threshold' },
    ],
    actions: [
      { type: 'price_up', value: 10, label: 'Augmenter prix +10%', color: '#059669', icon: ACTION_ICONS.price_up },
      { type: 'set_mlos', value: 2, label: 'Ajouter restriction MLOS', color: '#64748B', icon: ACTION_ICONS.set_mlos },
    ],
  },
  {
    id: 'r1', order: 5, name: "Stopper l'hémorragie last minute", shortName: "Last Minute", priority: "haute",
    category: "occupancy",
    icon: <Zap className="w-5 h-5" />, color: "#D97706", bg: "#FFF7ED",
    description: "J-2 / J-1 avec faible remplissage = danger. Il vaut mieux vendre moins cher que de dormir avec des chambres vides.",
    status: 'active', triggered: 8, lastTriggered: 'Il y a 6h',
    impact: 'Élimine les pertes sèches sur les nuits à faible occupation last minute.',
    conditions: [
      { label: 'Jours avant arrivée', operator: '≤', value: '2', editable: true, field: 'days_to_arrival' },
      { label: 'Occupation', operator: '<', value: '50%', editable: true, field: 'occupancy_low' },
    ],
    actions: [
      { type: 'price_down', value: 15, label: 'Baisser prix -15%', color: '#DC2626', icon: ACTION_ICONS.price_down },
      { type: 'open_sales', label: 'Ouvrir toutes les ventes', color: '#059669', icon: ACTION_ICONS.open_sales },
      { type: 'remove_mlos', label: 'Supprimer MLOS', color: '#2563EB', icon: ACTION_ICONS.remove_mlos },
    ],
  },
  {
    id: 'r2', order: 6, name: 'Maximiser en haute demande', shortName: 'Haute demande', priority: 'haute',
    category: 'occupancy',
    icon: <TrendingUp className="w-5 h-5" />, color: '#D97706', bg: '#FFF7ED',
    description: "Quand tu es presque plein, c'est l'erreur classique de continuer à vendre pas cher. Ferme les canaux low-cost et monte les prix.",
    status: 'active', triggered: 19, lastTriggered: 'Il y a 1h',
    impact: 'Hausse directe du RevPAR sur les nuits à forte pression.',
    conditions: [
      { label: 'Occupation', operator: '≥', value: '85%', editable: true, field: 'occupancy_high' },
    ],
    actions: [
      { type: 'price_up', value: 15, label: 'Augmenter prix +15%', color: '#059669', icon: ACTION_ICONS.price_up },
      { type: 'close_promo', label: 'Fermer tarifs promo', color: '#DC2626', icon: ACTION_ICONS.close_promo },
      { type: 'close_sales', label: 'Fermer OTA low-cost', color: '#64748B', icon: ACTION_ICONS.close_sales },
    ],
  },
  {
    id: 'r8', order: 7, name: 'Gestion lead time', shortName: 'Lead Time', priority: 'normale',
    category: 'lead_time',
    icon: <Clock className="w-5 h-5" />, color: '#059669', bg: '#ECFDF5',
    description: "Adapte ta stratégie selon l'horizon temporel : anticipe la hausse tôt, applique la baisse agressive proche de la date.",
    status: 'active', triggered: 7, lastTriggered: 'Hier',
    impact: 'Optimise le timing des ajustements de prix.',
    conditions: [
      { label: 'Jours avant arrivée', operator: '>', value: '20', editable: true, field: 'lead_far' },
      { label: 'ET Pickup', operator: '=', value: 'Fort' },
      { label: 'OU Jours avant arrivée', operator: '<', value: '5', editable: true, field: 'lead_close' },
      { label: 'ET Occupation', operator: '=', value: 'Faible' },
    ],
    actions: [
      { type: 'price_up', value: 10, label: 'Si lointain + pickup fort → +10%', color: '#059669', icon: ACTION_ICONS.price_up },
      { type: 'price_down', value: 15, label: 'Si proche + occupation faible → -15%', color: '#DC2626', icon: ACTION_ICONS.price_down },
    ],
  },
  {
    id: 'r9', order: 8, name: 'Compression marché (concurrence)', shortName: 'Compression', priority: 'normale',
    category: 'marche',
    icon: <Users className="w-5 h-5" />, color: '#7C3AED', bg: '#EDE9FE',
    description: "Quand >70% des hôtels du compset sont complets, c'est un signal massif souvent ignoré. Profites-en.",
    status: 'paused', triggered: 2, lastTriggered: 'Il y a 1 sem.',
    impact: 'Capture la valeur lors des pics de demande marché.',
    conditions: [
      { label: 'Hôtels compset complets', operator: '>', value: '70%', editable: true, field: 'market_full' },
    ],
    actions: [
      { type: 'price_up', value: 20, label: 'Augmenter prix +20%', color: '#059669', icon: ACTION_ICONS.price_up },
      { type: 'set_mlos', value: 2, label: 'Activer MLOS 2 nuits', color: '#64748B', icon: ACTION_ICONS.set_mlos },
    ],
  },
  {
    id: 'r3', order: 9, name: 'Activer MLOS (Minimum Stay)', shortName: 'MLOS', priority: 'normale',
    category: 'restrictions',
    icon: <Lock className="w-5 h-5" />, color: '#64748B', bg: '#F8FAFC',
    description: "Le MLOS est le levier le plus sous-utilisé. Il augmente le RevPAR sans toucher aux prix affichés.",
    status: 'active', triggered: 4, lastTriggered: 'Il y a 2j',
    impact: "Hausse du RevPAR sans augmenter les prix affichés.",
    conditions: [
      { label: 'Pression marché (DPS)', operator: '>', value: '70', editable: true, field: 'dps_threshold' },
      { label: 'OU Événement détecté', operator: '=', value: 'OUI' },
    ],
    actions: [
      { type: 'set_mlos', value: 2, label: 'MLOS = 2 nuits minimum', color: '#64748B', icon: ACTION_ICONS.set_mlos },
    ],
  },
  {
    id: 'r4', order: 10, name: "Fermer arrivées (CTA)", shortName: 'CTA', priority: 'normale',
    category: 'restrictions',
    icon: <AlertTriangle className="w-5 h-5" />, color: '#64748B', bg: '#F8FAFC',
    description: 'Ferme les arrivées sur les dates isolées à faible occupation quand la veille est quasi-complète. Évite les trous de planning.',
    status: 'paused', triggered: 1, lastTriggered: 'Il y a 5j',
    impact: 'Réduit les trous de planning qui coûtent du RevPAR.',
    conditions: [
      { label: 'Occupation veille', operator: '≥', value: '90%', editable: true, field: 'prev_occ' },
      { label: 'ET Date isolée', operator: '=', value: 'Faible occupation' },
    ],
    actions: [
      { type: 'set_cta', label: 'Fermer arrivées (CTA = ON)', color: '#DC2626', icon: ACTION_ICONS.set_cta },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusConfig = {
  active: { label: 'Active',  color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  paused: { label: 'Pausée',  color: '#D97706', bg: '#FFF7ED', dot: '#F59E0B' },
  draft:  { label: 'Brouillon',color: '#64748B', bg: '#F8FAFC', dot: '#94A3B8' },
};

const priorityConfig = {
  critique: { label: 'Critique', color: '#DC2626', bg: '#FEF2F2' },
  haute:    { label: 'Haute',    color: '#D97706', bg: '#FFF7ED' },
  normale:  { label: 'Normale',  color: '#64748B', bg: '#F8FAFC' },
};

// ─── Composant RuleCard ───────────────────────────────────────────────────────
const RuleCard: React.FC<{
  rule: Rule;
  onToggle: (id: string) => void;
  onChange: (id: string, rule: Rule) => void;
}> = ({ rule, onToggle, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localConditions, setLocalConditions] = useState(rule.conditions);
  const cat = CATEGORY_LABELS[rule.category];
  const st = statusConfig[rule.status];
  const pr = priorityConfig[rule.priority];

  const handleSaveConditions = () => {
    onChange(rule.id, { ...rule, conditions: localConditions });
    setEditing(false);
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message: `Règle sauvegardée · ${rule.shortName}` }
    }));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      style={{ boxShadow: rule.status === 'active' ? `0 2px 12px ${rule.color}18` : '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Ordre + icône */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-100">
            {rule.order}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: rule.bg, color: rule.color }}>
            {rule.icon}
          </div>
        </div>

        {/* Info principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-bold text-slate-900 leading-tight">{rule.name}</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: pr.bg, color: pr.color }}>
              {pr.label}
            </span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
              {cat.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{rule.description}</div>
        </div>

        {/* Stats */}
        <div className="hidden xl:flex items-center gap-4 text-right flex-shrink-0">
          <div>
            <div className="text-[16px] font-bold text-slate-800">{rule.triggered}</div>
            <div className="text-[9px] text-slate-400">déclenchements</div>
          </div>
          {rule.lastTriggered && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500">{rule.lastTriggered}</div>
              <div className="text-[9px] text-slate-400">dernier</div>
            </div>
          )}
        </div>

        {/* Statut + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg"
            style={{ background: st.bg, color: st.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
          <button
            onClick={() => onToggle(rule.id)}
            title={rule.status === 'active' ? 'Mettre en pause' : 'Activer'}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all border"
            style={{
              background: rule.status === 'active' ? '#FFF7ED' : '#ECFDF5',
              borderColor: rule.status === 'active' ? '#FED7AA' : '#BBF7D0',
              color: rule.status === 'active' ? '#D97706' : '#059669',
            }}
          >
            {rule.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 transition-all"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Détail expandable ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="p-5 grid grid-cols-2 gap-5 bg-slate-50/50">
              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conditions SI</div>
                  {!editing && (
                    <button onClick={() => { setEditing(true); setLocalConditions(rule.conditions); }}
                      className="text-[10px] font-semibold text-primary flex items-center gap-1 hover:underline">
                      <Settings className="w-3 h-3" /> Modifier
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {(editing ? localConditions : rule.conditions).map((cond, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-500 min-w-[90px]">{cond.label}</span>
                      <span className="text-[10px] font-bold text-slate-400 mx-1">{cond.operator}</span>
                      {editing && cond.editable ? (
                        <input
                          type="text"
                          value={localConditions[i].value}
                          onChange={e => {
                            const updated = [...localConditions];
                            updated[i] = { ...updated[i], value: e.target.value };
                            setLocalConditions(updated);
                          }}
                          className="text-[11px] font-bold text-primary border-b border-primary/40 bg-transparent outline-none flex-1 min-w-0"
                        />
                      ) : (
                        <span className="text-[11px] font-bold flex-1 min-w-0" style={{ color: rule.color }}>{cond.value}</span>
                      )}
                    </div>
                  ))}
                </div>
                {editing && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSaveConditions}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                      <Save className="w-3 h-3" /> Sauvegarder
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-600 transition-all">
                      <RotateCcw className="w-3 h-3" /> Annuler
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Actions ALORS</div>
                <div className="space-y-2">
                  {rule.actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${action.color}18`, color: action.color }}>
                        {action.icon}
                      </div>
                      <span className="text-[11px] font-semibold flex-1" style={{ color: action.color }}>{action.label}</span>
                    </div>
                  ))}
                </div>

                {/* Impact */}
                <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ background: rule.bg }}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: rule.color }} />
                  <span className="text-[11px] leading-relaxed" style={{ color: rule.color }}>{rule.impact}</span>
                </div>
                {rule.warning && (
                  <div className="mt-2 p-3 bg-red-50 rounded-xl flex items-start gap-2 border border-red-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] text-red-600 leading-relaxed font-medium">{rule.warning}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export const AutoRules: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const activeCount  = rules.filter(r => r.status === 'active').length;
  const pausedCount  = rules.filter(r => r.status === 'paused').length;
  const totalTriggers = rules.reduce((s, r) => s + r.triggered, 0);

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (r.id === 'r10') {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: 'Règle protégée · Le filet de sécurité ne peut pas être désactivé' }
        }));
        return r;
      }
      const next: RuleStatus = r.status === 'active' ? 'paused' : 'active';
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: `Règle ${next === 'active' ? 'activée' : 'mise en pause'} · ${r.shortName}` }
      }));
      return { ...r, status: next };
    }));
  };

  const handleChange = (id: string, updated: Rule) => {
    setRules(prev => prev.map(r => r.id === id ? updated : r));
  };

  const handleActivateAll = () => {
    setRules(prev => prev.map(r => ({ ...r, status: 'active' as RuleStatus })));
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message: 'Toutes les règles activées · Moteur automatique opérationnel' }
    }));
  };

  const filteredRules = rules.filter(r => {
    if (filterCat !== 'all' && r.category !== filterCat) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Règles automatiques
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Moteur de décision automatique — prix et restrictions ajustés en temps réel selon 10 règles priorisées.
          </p>
        </div>
        <button
          onClick={handleActivateAll}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
        >
          <Play className="w-4 h-4" /> Tout activer
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Règles actives',    value: activeCount,   color: '#059669', bg: '#ECFDF5', icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: 'En pause',          value: pausedCount,   color: '#D97706', bg: '#FFF7ED', icon: <Pause className="w-4 h-4" /> },
          { label: 'Déclenchements 30j',value: totalTriggers, color: '#7C3AED', bg: '#EDE9FE', icon: <Zap className="w-4 h-4" /> },
          { label: 'Total règles',      value: rules.length,  color: '#2563EB', bg: '#EFF6FF', icon: <Settings className="w-4 h-4" /> },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── ORDRE D'APPLICATION ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Ordre d'application obligatoire — résout les conflits
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(CATEGORY_LABELS).map(([key, cat], i) => (
            <React.Fragment key={key}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: `${cat.color}22`, color: cat.color, border: `1px solid ${cat.color}33` }}>
                {cat.icon} {cat.label}
              </div>
              {i < 5 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-slate-400">
          ⚠️ Ne pas mettre toutes les règles au même poids. Ne pas oublier les restrictions (MLOS / CTA) — erreur grave fréquente.
        </div>
      </div>

      {/* ── FILTRES ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'Toutes' }, ...Object.entries(CATEGORY_LABELS).map(([id, c]) => ({ id, label: c.label.replace(/^\d+\.\s*/, '') }))].map(f => (
            <button key={f.id} onClick={() => setFilterCat(f.id)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border"
              style={filterCat === f.id
                ? { background: '#8B5CF6', color: 'white', borderColor: '#8B5CF6' }
                : { background: 'white', color: '#64748B', borderColor: '#E2E8F0' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {['all', 'active', 'paused'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border"
              style={filterStatus === s
                ? { background: '#1E293B', color: 'white', borderColor: '#1E293B' }
                : { background: 'white', color: '#64748B', borderColor: '#E2E8F0' }}>
              {s === 'all' ? 'Tous statuts' : s === 'active' ? '🟢 Actives' : '🟡 En pause'}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTE DES RÈGLES ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredRules.map(rule => (
            <RuleCard key={rule.id} rule={rule} onToggle={handleToggle} onChange={handleChange} />
          ))}
        </AnimatePresence>
        {filteredRules.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-4">🤖</div>
            <div className="text-base font-bold text-slate-700 mb-1">Aucune règle dans ce filtre</div>
            <div className="text-sm text-slate-400">Changez les filtres pour voir les règles disponibles.</div>
          </div>
        )}
      </div>

      {/* ── NOTE BOTTOM ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-[12px] text-amber-700 leading-relaxed">
          <strong>Rappel :</strong> Sans RMS automatisé, vous perdez en moyenne 8-15% de RevPAR annuel sur des erreurs de pricing
          évitables (sous-pricing en haute demande, sur-pricing last minute, oubli des restrictions).
          Ces 10 règles couvrent 90% des cas critiques du revenue management hôtelier.
        </div>
      </div>
    </div>
  );
};
