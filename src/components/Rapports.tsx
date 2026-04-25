import React, { useMemo, useState, useRef } from "react";
import {
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  Download,
  FileText,
  BarChart2,
  PieChart,
  Globe,
  ArrowRight,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  LayoutDashboard,
  ClipboardList,
  Printer,
  History,
  ShieldCheck,
  Coffee,
  Trophy,
  Crown,
  Tags,
  ShoppingCart,
  RefreshCcw,
  BarChart3,
  PlaneLanding,
  PlaneTakeoff,
  Clock,
  Euro,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import * as XLSX from "xlsx";
// @ts-ignore
import html2pdf from "html2pdf.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ReportProps {
  onBack: () => void;
  clients: any[];
  reservations: any[];
  rooms: any[];
}

// Pastel Palette for Flowtym
const COLORS = {
  violet: {
    light: "#F5F3FF",
    border: "#DDD6FE",
    main: "#8B5CF6",
    text: "#5B21B6",
  },
  emerald: {
    light: "#ECFDF5",
    border: "#A7F3D0",
    main: "#10B981",
    text: "#065F46",
  },
  blue: {
    light: "#EFF6FF",
    border: "#BFDBFE",
    main: "#3B82F6",
    text: "#1E40AF",
  },
  amber: {
    light: "#FFFBEB",
    border: "#FDE68A",
    main: "#F59E0B",
    text: "#92400E",
  },
  rose: {
    light: "#FFF1F2",
    border: "#FECDD3",
    main: "#F43F5E",
    text: "#9F1239",
  },
  slate: {
    light: "#F8FAFC",
    border: "#E2E8F0",
    main: "#64748B",
    text: "#1E293B",
  },
};

// ==================== DONNÉES STATISTIQUES (MOCK) ====================
const OCCUPATION_DATA = [
  {
    rank: 1,
    name: "Chambre Double Classique",
    reservations: 1319,
    nights: 3461,
    percent: 42.88,
  },
  {
    rank: 2,
    name: "Chambre Triple Classique",
    reservations: 604,
    nights: 2042,
    percent: 19.64,
  },
  {
    rank: 3,
    name: "Double Single Use Classique",
    reservations: 403,
    nights: 883,
    percent: 13.1,
  },
  {
    rank: 4,
    name: "Chambre supérieure 1 ou 2 personnes",
    reservations: 181,
    nights: 517,
    percent: 5.88,
  },
  {
    rank: 5,
    name: "Chambre Twin - Deluxe",
    reservations: 143,
    nights: 502,
    percent: 4.65,
  },
  {
    rank: 6,
    name: "Chambre Triple Deluxe",
    reservations: 127,
    nights: 464,
    percent: 4.13,
  },
  {
    rank: 7,
    name: "Chambre Double Deluxe",
    reservations: 91,
    nights: 276,
    percent: 2.96,
  },
  {
    rank: 8,
    name: "Suite Junior",
    reservations: 63,
    nights: 216,
    percent: 2.05,
  },
  {
    rank: 9,
    name: "Chambres Adjacentes 5 personnes",
    reservations: 46,
    nights: 127,
    percent: 1.5,
  },
  {
    rank: 10,
    name: "Chambres communicantes 5 personnes",
    reservations: 36,
    nights: 128,
    percent: 1.17,
  },
  {
    rank: 11,
    name: "Chambres communicantes 6 personnes",
    reservations: 23,
    nights: 89,
    percent: 0.75,
  },
  {
    rank: 12,
    name: "Chambres Adjacentes 6 pessoas",
    reservations: 18,
    nights: 58,
    percent: 0.59,
  },
  {
    rank: 13,
    name: "Chambres Adjacentes 4 personnes",
    reservations: 13,
    nights: 50,
    percent: 0.42,
  },
  {
    rank: 14,
    name: "Chambres communicantes 4 personnes",
    reservations: 9,
    nights: 28,
    percent: 0.29,
  },
];

const RATEPLANS_DATA: Record<string, any[]> = {
  "Booking.com": [
    {
      name: "Room Only",
      reservations: 850,
      nights: 2200,
      revenue: 198000,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 320,
      nights: 980,
      revenue: 107800,
      avgPrice: 110,
    },
    {
      name: "Demi-pension",
      reservations: 150,
      nights: 420,
      revenue: 58800,
      avgPrice: 140,
    },
  ],
  Expedia: [
    {
      name: "Room Only",
      reservations: 420,
      nights: 1100,
      revenue: 99000,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 280,
      nights: 850,
      revenue: 93500,
      avgPrice: 110,
    },
    {
      name: "Demi-pension",
      reservations: 95,
      nights: 260,
      revenue: 36400,
      avgPrice: 140,
    },
  ],
  Direct: [
    {
      name: "Room Only",
      reservations: 320,
      nights: 850,
      revenue: 76500,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 180,
      nights: 520,
      revenue: 57200,
      avgPrice: 110,
    },
    {
      name: "Demi-pension",
      reservations: 75,
      nights: 210,
      revenue: 29400,
      avgPrice: 140,
    },
  ],
  Airbnb: [
    {
      name: "Room Only",
      reservations: 200,
      nights: 550,
      revenue: 49500,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 80,
      nights: 220,
      revenue: 24200,
      avgPrice: 110,
    },
  ],
};

const NATIONALITIES_STATS_DATA: Record<string, any[]> = {
  "Booking.com": [
    {
      country: "Arabie Saoudite",
      code: "sa",
      reservations: 450,
      nights: 1200,
      percent: 35,
    },
    {
      country: "France",
      code: "fr",
      reservations: 320,
      nights: 850,
      percent: 25,
    },
    {
      country: "États-Unis",
      code: "us",
      reservations: 120,
      nights: 350,
      percent: 10,
    },
    {
      country: "Allemagne",
      code: "de",
      reservations: 80,
      nights: 220,
      percent: 6,
    },
    {
      country: "Autres",
      code: "un",
      reservations: 300,
      nights: 800,
      percent: 24,
    },
  ],
  Expedia: [
    {
      country: "France",
      code: "fr",
      reservations: 280,
      nights: 750,
      percent: 40,
    },
    {
      country: "Royaume-Uni",
      code: "gb",
      reservations: 150,
      nights: 400,
      percent: 22,
    },
    {
      country: "États-Unis",
      code: "us",
      reservations: 100,
      nights: 280,
      percent: 14,
    },
    {
      country: "Autres",
      code: "un",
      reservations: 170,
      nights: 450,
      percent: 24,
    },
  ],
};

const PARTNERS_DATA = [
  { name: "Booking.com", res: 142, nights: 426, rev: 46860, share: 45 },
  { name: "Expedia", res: 84, nights: 252, rev: 26460, share: 25 },
  { name: "Direct", res: 62, nights: 186, rev: 21570, share: 21 },
  { name: "Airbnb", res: 28, nights: 84, rev: 9450, share: 9 },
];

const MONTHLY_TRENDS = {
  labels: [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ],
  revenue: [
    45000, 48000, 52000, 61000, 75000, 89000, 95000, 92000, 78000, 65000, 55000,
    58000,
  ],
  reservations: [120, 135, 142, 168, 195, 230, 245, 238, 185, 150, 130, 145],
};

const CHANNEL_PRICES = [
  { name: "Direct", price: 116, diff: 0 },
  { name: "Booking.com", price: 110, diff: -5 },
  { name: "Expedia", price: 105, diff: -9 },
  { name: "Airbnb", price: 112, diff: -3 },
];

const DAY_ACTIVITY = { arrivals: 12, departures: 8, rate: 66, occ: 78 };

const ApercuView: React.FC<{
  nationalityData: any[];
  totalAnalytics: any;
  activeSubTab: string;
  setActiveSubTab: (s: string) => void;
}> = ({ nationalityData, totalAnalytics, activeSubTab, setActiveSubTab }) => {
  const [rateplanPartner, setRateplanPartner] = useState("Booking.com");
  const [nationalityPartner, setNationalityPartner] = useState("Booking.com");
  const [period, setPeriod] = useState("Toutes périodes");
  const [trendYear, setTrendYear] = useState("2026");

  const subTabs = [
    {
      id: "nationalites-advanced",
      label: "Analyse avancée (Nationalités)",
      icon: Globe,
    },
    { id: "top-partners", label: "Top Partenaires", icon: Trophy },
    { id: "trends", label: "Tendances Mensuelles", icon: TrendingUp },
    { id: "channel-rates", label: "Tarifs par Canal", icon: Tags },
    { id: "day-activity", label: "Activité du Jour", icon: Clock },
    {
      id: "nationalites-channel",
      label: "Nationalités par Canal",
      icon: PieChart,
    },
    {
      id: "room-types",
      label: "Répartition par Type de Chambre",
      icon: BarChart2,
    },
    {
      id: "rate-plans",
      label: "Classement des Plans Tarifaires",
      icon: Trophy,
    },
  ];

  const kpis = [
    {
      label: "TO% GLOBAL",
      value: "75%",
      icon: BarChart3,
      color: "#8B5CF6",
      delta: "+2.4%",
    },
    {
      label: "ADR",
      value: "120 €",
      icon: Euro,
      color: "#10B981",
      delta: "+12 €",
    },
    {
      label: "RevPAR",
      value: "90 €",
      icon: TrendingUp,
      color: "#3B82F6",
      delta: "+8 €",
    },
    {
      label: "Panier Moyen",
      value: "156 €",
      icon: ShoppingCart,
      color: "#F59E0B",
      delta: "+5 €",
    },
    {
      label: "Conversion",
      value: "3.2%",
      icon: RefreshCcw,
      color: "#EC4899",
      delta: "+0.5%",
    },
  ];

  const occupationTotal = {
    res: OCCUPATION_DATA.reduce((sum, d) => sum + d.reservations, 0),
    nights: OCCUPATION_DATA.reduce((sum, d) => sum + d.nights, 0),
  };

  const topRoom = OCCUPATION_DATA.reduce(
    (max, d) => (d.percent > max.percent ? d : max),
    OCCUPATION_DATA[0],
  );

  const currentRateplans =
    RATEPLANS_DATA[rateplanPartner] || RATEPLANS_DATA["Booking.com"];
  const currentNationalities =
    NATIONALITIES_STATS_DATA[nationalityPartner] ||
    NATIONALITIES_STATS_DATA["Booking.com"];

  const occupationChartData = {
    labels: OCCUPATION_DATA.map((d) => d.name),
    datasets: [
      {
        data: OCCUPATION_DATA.map((d) => d.percent),
        backgroundColor: [
          "#8B5CF6",
          "#A78BFA",
          "#C4B5FD",
          "#E9D5FF",
          "#F3E8FF",
          "#FFEDD5",
          "#FED7AA",
          "#FEF3C7",
          "#ECFDF5",
          "#E0F2FE",
          "#FCE7F3",
          "#FEF2F2",
          "#F1F5F9",
          "#E2E8F0",
        ],
        borderWidth: 0,
      },
    ],
  };

  const rateplansChartData = {
    labels: currentRateplans.map((p) => p.name),
    datasets: [
      {
        label: "Revenu (€)",
        data: currentRateplans.map((p) => p.revenue),
        backgroundColor: "#8B5CF6",
        borderRadius: 12,
      },
    ],
  };

  const nationalityChartData = {
    labels: currentNationalities.map((n) => n.country),
    datasets: [
      {
        data: currentNationalities.map((n) => n.percent),
        backgroundColor: [
          "#8B5CF6",
          "#A78BFA",
          "#C4B5FD",
          "#E9D5FF",
          "#F3E8FF",
        ],
        borderWidth: 0,
      },
    ],
  };

  const partnersChartData = {
    labels: PARTNERS_DATA.map((p) => p.name),
    datasets: [
      {
        label: "Revenu (€)",
        data: PARTNERS_DATA.map((p) => p.rev),
        backgroundColor: ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"],
        borderRadius: 12,
        barThickness: 32,
      },
    ],
  };

  const trendsChartData = {
    labels: MONTHLY_TRENDS.labels,
    datasets: [
      {
        label: "Revenu (€)",
        data: MONTHLY_TRENDS.revenue,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Réservations",
        data: MONTHLY_TRENDS.reservations.map((r) => r * 200), // Scaled for display
        borderColor: "#10B981",
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { size: 10, weight: "bold" as any },
          boxWidth: 12,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "bold" as any } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "bold" as any } },
      },
    },
  };

  const PeriodSelector = () => (
    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
      <Calendar className="w-4 h-4 text-slate-400" />
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="text-[11px] font-black text-slate-700 bg-transparent outline-none cursor-pointer uppercase tracking-widest"
      >
        <option>Aujourd'hui</option>
        <option>Cette semaine</option>
        <option>Ce mois</option>
        <option>Toutes périodes</option>
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* KPI Stratégiques */}
      <div className="grid grid-cols-5 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: kpi.color }}
            />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:scale-110 transition-transform">
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                {kpi.delta}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {kpi.label}
            </p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">
              {kpi.value}
            </h4>
          </div>
        ))}
      </div>

      <div className="flex gap-10 items-start">
        {/* Sidebar Gauche */}
        <div className="w-80 sticky top-32 space-y-3 bg-white/50 p-4 rounded-[32px] border border-slate-200/50 backdrop-blur-md">
          <div className="px-4 pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Navigation Apercu
            </h3>
          </div>
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border ${activeSubTab === tab.id ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:text-primary hover:shadow-lg"}`}
            >
              <tab.icon
                className={`w-5 h-5 ${activeSubTab === tab.id ? "text-white" : "text-slate-300"}`}
              />
              <span className="text-[12px] font-black text-left leading-tight tracking-tight">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Zone de Contenu */}
        <div className="flex-1 min-w-0 space-y-8">
          <div className="flex justify-between items-center bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-2">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {subTabs.find((t) => t.id === activeSubTab)?.label}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Analyse détaillée des performances
              </p>
            </div>
            <PeriodSelector />
          </div>

          {activeSubTab === "top-partners" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Top Partenaires
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Performance par canal de distribution
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Partenaire</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">CA Total</th>
                        <th className="pb-4 text-right">Part %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {PARTNERS_DATA.map((p, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
                              {p.name}
                            </span>
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {p.res}
                          </td>
                          <td className="py-4 text-right text-[12px] font-black text-slate-900">
                            {p.rev.toLocaleString()} €
                          </td>
                          <td className="py-4 text-right">
                            <div className="inline-block px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[11px] font-black">
                              {p.share}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[350px]">
                  <Bar
                    data={partnersChartData}
                    options={{
                      indexAxis: "y" as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { display: false },
                        y: {
                          grid: { display: false },
                          ticks: { font: { weight: "bold" as any } },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "trends" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Tendances Mensuelles
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Evolution du revenu et des réservations
                    </p>
                  </div>
                </div>
                <select
                  value={trendYear}
                  onChange={(e) => setTrendYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-[11px] font-black"
                >
                  <option>2026</option>
                  <option>2025</option>
                </select>
              </div>
              <div className="h-[450px]">
                <Line
                  data={trendsChartData}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: { ...chartOptions.scales.y, display: true },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {activeSubTab === "channel-rates" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Tags className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Tarifs par Canal
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Prix moyen par canal de distribution
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {CHANNEL_PRICES.map((c, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative group hover:border-primary/30 transition-all"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      {c.name}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-800">
                        {c.price} €
                      </span>
                    </div>
                    <div
                      className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black px-3 py-1 rounded-lg ${c.diff === 0 ? "bg-slate-200 text-slate-500" : c.diff > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {c.diff === 0 ? "RÉFÉRENCE" : `${c.diff}% vs Direct`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "day-activity" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Activité du Jour
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Flux d'entrées et de sorties
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-violet-50 rounded-[32px] p-10 border border-violet-100 flex flex-col items-center text-center">
                  <PlaneLanding className="w-10 h-10 text-violet-600 mb-4" />
                  <div className="text-4xl font-black text-violet-700 mb-2">
                    {DAY_ACTIVITY.arrivals}
                  </div>
                  <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
                    Arrivées
                  </p>
                </div>
                <div className="bg-amber-50 rounded-[32px] p-10 border border-amber-100 flex flex-col items-center text-center">
                  <PlaneTakeoff className="w-10 h-10 text-amber-600 mb-4" />
                  <div className="text-4xl font-black text-amber-700 mb-2">
                    {DAY_ACTIVITY.departures}
                  </div>
                  <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                    Départs
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-[32px] p-10 border border-emerald-100 flex flex-col items-center text-center">
                  <RefreshCcw className="w-10 h-10 text-emerald-600 mb-4" />
                  <div className="text-4xl font-black text-emerald-700 mb-2">
                    {DAY_ACTIVITY.rate}%
                  </div>
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                    Taux de départ vs arrivées
                  </p>
                </div>
              </div>
              <div className="mt-10 p-8 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight">
                      Taux d'Occupation du Jour
                    </h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Base de calcul : 48 chambres
                    </p>
                  </div>
                </div>
                <div className="text-5xl font-black text-primary">
                  {DAY_ACTIVITY.occ}%
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "nationalites-advanced" && (
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                      Performances par Nationalité
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Données consolidées multi-canaux
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-black text-violet-600 bg-violet-100/50 px-6 py-3 rounded-2xl uppercase tracking-widest border border-violet-100">
                  Total CA Consolidé : {totalAnalytics.total.toLocaleString()} €
                </div>
              </div>
              <div className="p-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-10 py-6">Pays / Origine</th>
                      <th className="px-8 py-6 text-center">Nuits (PM)</th>
                      <th className="px-8 py-6 text-right">CA Hébergement</th>
                      <th className="px-8 py-6 text-right">CA Extras / F&B</th>
                      <th className="px-10 py-6 text-right">Total Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 italic-rows">
                    {nationalityData.map((d, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-10 py-5 flex items-center gap-6">
                          <span
                            className={`fi fi-${d.flag} text-2xl rounded-md shadow-sm border border-slate-200`}
                          ></span>
                          <span className="text-[14px] font-black text-slate-700">
                            {d.country}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center text-slate-400 font-extrabold text-[13px]">
                          {d.pm}
                        </td>
                        <td className="px-8 py-5 text-right text-slate-600 font-bold text-[13px]">
                          {d.stay.toLocaleString()} €
                        </td>
                        <td className="px-8 py-5 text-right text-slate-600 font-bold text-[13px]">
                          {d.fb.toLocaleString()} €
                        </td>
                        <td className="px-10 py-5 text-right">
                          <div className="bg-violet-100/50 rounded-2xl px-5 py-2.5 shadow-sm inline-block group-hover:scale-105 transition-transform border border-violet-100">
                            <span className="text-[16px] font-black text-violet-700 tracking-tight">
                              {d.total.toLocaleString()} €
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === "nationalites-channel" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Répartition des Nationalités
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Par canal de réservation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={nationalityPartner}
                    onChange={(e) => setNationalityPartner(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:bg-white"
                  >
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Nationalité</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">Nuitées</th>
                        <th className="pb-4 text-right">% Part</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentNationalities.map((n, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 flex items-center gap-4">
                            <span
                              className={`fi fi-${n.code} text-xl rounded shadow-sm`}
                            ></span>
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
                              {n.country}
                            </span>
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {n.reservations.toLocaleString()}
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {n.nights.toLocaleString()}
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="inline-flex items-center justify-end w-16 h-8 bg-slate-100 rounded-lg px-3 text-[12px] font-black text-slate-800">
                              {n.percent}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[400px]">
                  <Pie data={nationalityChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "room-types" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Répartition par Type de Chambre
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Performance commerciale par catégorie
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Rang / Type</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">Nuitées</th>
                        <th className="pb-4 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {OCCUPATION_DATA.map((d, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center">
                                {d.rank}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700">
                                {d.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-[11px] font-bold text-slate-500">
                            {d.reservations.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-[11px] font-bold text-slate-500">
                            {d.nights.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-[11px] font-black text-primary">
                            {d.percent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[400px] relative">
                  <Pie data={occupationChartData} options={chartOptions} />
                </div>
              </div>
              <div className="mt-10 bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-8 text-white flex items-center justify-between shadow-lg shadow-violet-200">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <Crown className="w-8 h-8 text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">
                      Type de chambre le plus commercialisé
                    </p>
                    <h4 className="text-xl font-black">{topRoom.name}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">
                    {topRoom.percent.toFixed(1)}%
                  </div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    des nuitées totales
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "rate-plans" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Classement des Plans Tarifaires
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Par partenaire de distribution
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={rateplanPartner}
                    onChange={(e) => setRateplanPartner(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:bg-white"
                  >
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                    <option value="Direct">Direct</option>
                    <option value="Airbnb">Airbnb</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Plan Tarifaire</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">CA Total</th>
                        <th className="pb-4 text-right">Prix Moy.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentRateplans.map((p, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
                              {p.name}
                            </span>
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {p.reservations.toLocaleString()}
                          </td>
                          <td className="py-4 text-right text-[12px] font-black text-emerald-600">
                            {p.revenue.toLocaleString()} €
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-800 bg-slate-50/50 rounded-xl px-4">
                            {p.avgPrice} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[350px]">
                  <Bar
                    data={rateplansChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          grid: { display: false },
                          ticks: {
                            font: { size: 10, weight: "bold" as const },
                          },
                        },
                        x: {
                          grid: { display: false },
                          ticks: {
                            font: { size: 10, weight: "bold" as const },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Rapports: React.FC<ReportProps> = ({
  onBack,
  clients,
  reservations,
  rooms,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "apercu" | "allreports"
  >("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("nationalites-advanced");
  const [currentFamily, setCurrentFamily] = useState("exp");
  const [activeReport, setActiveReport] = useState<string>(
    "STA-10 Analyse avancée (Nationalités)",
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // --- REPORT LIST (49 Reports) ---
  const reportsByFamily = useMemo(
    () => ({
      exp: {
        label: "Exploitation",
        icon: <ClipboardList className="w-4 h-4" />,
        color: COLORS.violet,
        reports: [
          "EXP-01 Occupation temps réel",
          "EXP-02 Cardex Client",
          "EXP-03 Petit-déjeuner",
          "EXP-04 PDJ pré-facturés",
          "EXP-05 Planning du jour",
          "EXP-06 Feuille gouvernante",
          "EXP-07 Attribution chambres",
          "EXP-08 Liste de Groupes",
          "EXP-09 No-shows",
          "EXP-10 Départs du jour",
          "EXP-11 Prévision repas",
          "EXP-12 Taux de change",
          "EXP-13 F&B Détails",
          "EXP-14 Occupation prévisionnelle",
          "EXP-15 Productivité ménage",
          "EXP-16 Planning personnel",
        ],
      },
      sta: {
        label: "Statistiques",
        icon: <TrendingUp className="w-4 h-4" />,
        color: COLORS.blue,
        reports: [
          "STA-01 Dashboard cumulé",
          "STA-02 Analyse tarifs",
          "STA-03 Allotements",
          "STA-04 Analyse clients",
          "STA-05 Canaux distribution",
          "STA-06 Nationalités & Pays",
          "STA-07 Déclaration INSEE",
          "STA-08 Rotation chambres",
          "STA-09 Turnover chambres",
          "STA-10 Analyse avancée (Nationalités)",
          "STA-11 Segmentation du Marché",
        ],
      },
      fin: {
        label: "Financier",
        icon: <PieChart className="w-4 h-4" />,
        color: COLORS.emerald,
        reports: [
          "FIN-01 Journal prestations",
          "FIN-02 Journal règlements",
          "FIN-03 Compte de résultat",
          "FIN-04 Balance âgée",
          "FIN-05 Contrôle soldes",
          "FIN-06 Petite caisse",
          "FIN-07 Recouchant facturé",
          "FIN-08 Position globale",
          "FIN-09 Déclaration TVA",
          "FIN-10 Situation financière",
          "FIN-11 Rapport de caisse",
          "FIN-12 Taxe de séjour",
          "FIN-13 Clôture de caisse",
          "FIN-14 Commissions OTA",
          "FIN-15 Taxe séjour déclarative",
          "FIN-16 Rapport de facturation",
        ],
      },
      cli: {
        label: "Clients",
        icon: <Users className="w-4 h-4" />,
        color: COLORS.amber,
        reports: [
          "CLI-01 Liste Débiteurs",
          "CLI-02 Arrhes & acomptes",
          "CLI-03 Crédits clients",
          "CLI-04 États antérieurs",
          "CLI-05 Statistiques CLV",
        ],
      },
      dir: {
        label: "Direction",
        icon: <ShieldCheck className="w-4 h-4" />,
        color: COLORS.rose,
        reports: ["DIR-01 Synthèse direction"],
      },
    }),
    [],
  );

  // --- DATA MOCKING ---
  const nationalityData = useMemo(
    () => [
      {
        country: "France",
        flag: "fr",
        noShow: 0,
        pm: 12,
        stay: 12400,
        fb: 1540,
        cancels: 2,
        total: 13940,
      },
      {
        country: "Royaume-Uni",
        flag: "gb",
        noShow: 1,
        pm: 8,
        stay: 8450,
        fb: 960,
        cancels: 1,
        total: 9410,
      },
      {
        country: "États-Unis",
        flag: "us",
        noShow: 0,
        pm: 15,
        stay: 21600,
        fb: 2400,
        cancels: 0,
        total: 24000,
      },
      {
        country: "Allemagne",
        flag: "de",
        noShow: 0,
        pm: 6,
        stay: 6850,
        fb: 780,
        cancels: 0,
        total: 7630,
      },
      {
        country: "Espagne",
        flag: "es",
        noShow: 0,
        pm: 4,
        stay: 4200,
        fb: 520,
        cancels: 1,
        total: 4720,
      },
      {
        country: "Italie",
        flag: "it",
        noShow: 1,
        pm: 3,
        stay: 3100,
        fb: 410,
        cancels: 0,
        total: 3510,
      },
      {
        country: "Belgique",
        flag: "be",
        noShow: 0,
        pm: 5,
        stay: 5600,
        fb: 680,
        cancels: 0,
        total: 6280,
      },
      {
        country: "Suisse",
        flag: "ch",
        noShow: 0,
        pm: 7,
        stay: 8900,
        fb: 1100,
        cancels: 2,
        total: 10000,
      },
    ],
    [],
  );

  const totalAnalytics = useMemo(() => {
    return nationalityData.reduce(
      (acc, curr) => ({
        noShow: acc.noShow + curr.noShow,
        pm: acc.pm + curr.pm,
        stay: acc.stay + curr.stay,
        fb: acc.fb + curr.fb,
        cancels: acc.cancels + curr.cancels,
        total: acc.total + curr.total,
      }),
      { noShow: 0, pm: 0, stay: 0, fb: 0, cancels: 0, total: 0 },
    );
  }, [nationalityData]);

  const genericMockData = useMemo(() => {
    const isFin = activeReport.startsWith("FIN");
    const isExp = activeReport.startsWith("EXP");
    const isSta = activeReport.startsWith("STA");

    return Array.from({ length: 65 }, (_, i) => {
      const code = activeReport.split(" ")[0];
      let row = {
        id: i + 1,
        col1: `#${(i + 101).toString().padStart(4, "0")}`,
        col2: `Libellé Rapport — ${code} Item ${i + 1}`,
        col3: (Math.random() * 50 + 1).toFixed(0),
        col4: i % 3 === 0 ? "Exécuté" : "En cours",
        col5: (Math.random() * 1200 + 400).toFixed(2),
      };

      if (isFin) {
        row.col2 = `Transaction Financière ${String.fromCharCode(65 + (i % 26))}${i + 1000}`;
        row.col4 = i % 4 === 0 ? "Journalisé" : "Pointé";
      } else if (isExp) {
        row.col2 = `Gouvernante / Room #${(101 + i) % 500} — Statut: ${i % 2 === 0 ? "Fait" : "À faire"}`;
        row.col4 = i % 2 === 0 ? "OK" : "Attente";
      } else if (isSta) {
        row.col2 = `Segmentation Groupe ${i + 1} — Segment: ${["Business", "Loisir", "Groupes"][i % 3]}`;
        row.col4 = "Calculé";
      }

      return row;
    });
  }, [activeReport]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return genericMockData.slice(start, start + itemsPerPage);
  }, [genericMockData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(genericMockData.length / itemsPerPage);

  // --- EXPORTS ---
  const handleExportExcel = () => {
    let data = [];
    let name = "export";

    if (activeTab === "apercu") {
      if (activeSubTab === "nationalites-advanced") {
        data = nationalityData.map((d) => ({
          Pays: d.country,
          Nuits: d.pm,
          Hébergement: d.stay,
          Extras: d.fb,
          Total: d.total,
        }));
        name = "analyse_nationalites";
      } else if (activeSubTab === "nationalites-channel") {
        const stats = NATIONALITIES_STATS_DATA[nationalityPartner] || [];
        data = stats.map((n) => ({
          Pays: n.country,
          Réservations: n.reservations,
          Nuitées: n.nights,
          Part: n.percent + "%",
        }));
        name = `nationalites_${nationalityPartner}`;
      } else if (activeSubTab === "room-types") {
        data = OCCUPATION_DATA.map((d) => ({
          Type: d.name,
          Réservations: d.reservations,
          Nuitées: d.nights,
          Pourcentage: d.percent + "%",
        }));
        name = "repartition_chambres";
      } else if (activeSubTab === "rate-plans") {
        const rates = RATEPLANS_DATA[rateplanPartner] || [];
        data = rates.map((p) => ({
          Plan: p.name,
          Réservations: p.reservations,
          "CA Total": p.revenue,
          "Prix Moyen": p.avgPrice,
        }));
        name = `plans_tarifs_${rateplanPartner}`;
      }
    } else {
      data = genericMockData.map((r) => ({
        ID: r.col1,
        Désignation: r.col2,
        Qté: r.col3,
        Statut: r.col4,
        Valeur: r.col5,
      }));
      name = activeReport.toLowerCase().replace(/ /g, "_");
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(
      wb,
      `flowtym_${name}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleExportPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `flowtym_rapport_${activeReport.toLowerCase().replace(/ /g, "_")}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "landscape" as const,
      },
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  // --- CHART OPTIONS ---
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1e293b",
        bodyColor: "#64748b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: "bold" as const },
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: "bold" as const },
        },
      },
    },
  };

  const doughnutOptions = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1e293b",
        bodyColor: "#64748b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
  };

  const channelChart = {
    labels: ["Booking.com", "Expedia", "Direct", "Airbnb", "Autres"],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          COLORS.violet.main,
          COLORS.blue.main,
          COLORS.emerald.main,
          COLORS.amber.main,
          COLORS.rose.main,
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const weeklyLineData = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      {
        label: "CA Réalisé",
        data: [2100, 2400, 1900, 2800, 3200, 4500, 3800],
        borderColor: COLORS.violet.main,
        backgroundColor: "rgba(139, 92, 246, 0.05)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative">
      {/* ─── NAVIGATION FAMILLES ─── */}
      <div
        className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap gap-3 sticky top-0 z-[1000] shadow-md"
        onClick={() => setOpenDropdown(null)}
      >
        {Object.entries(reportsByFamily).map(([key, data]: [any, any]) => (
          <div key={key} className="relative group/nav">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === key ? null : key);
              }}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[12.2px] font-black uppercase tracking-widest transition-all border ${currentFamily === key ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {data.icon}
              {data.label}{" "}
              <span className="opacity-50 text-[10px] ml-1">
                [{data.reports.length}]
              </span>
            </button>

            <AnimatePresence>
              {openDropdown === key && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[1001] py-4 max-h-[500px] overflow-y-auto custom-scrollbar ring-8 ring-slate-900/5 backdrop-blur-sm"
                >
                  <div className="px-5 pb-3 mb-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {data.label} — Séries
                    </span>
                  </div>
                  {data.reports.map((report) => {
                    const code = report.split(" ")[0];
                    const name = report.substring(code.length + 1);
                    const isActive = activeReport === report;
                    return (
                      <button
                        key={report}
                        onClick={() => {
                          setActiveReport(report);
                          setCurrentFamily(key);
                          setOpenDropdown(null);
                          setCurrentPage(1);
                          setActiveTab("allreports");
                        }}
                        className={`w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group ${isActive ? "bg-violet-50/50" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"} px-2 py-0.5 rounded font-mono text-[9px] font-black tracking-tight`}
                          >
                            {code}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${isActive ? "text-primary" : "text-slate-700"}`}
                          >
                            {name}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex-1 p-8 space-y-8">
        {/* --- Tab Switchers --- */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "dashboard" ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("apercu")}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "apercu" ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <BarChart2 className="w-4 h-4" /> Apercu
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportPDF}
              className="px-6 py-3 bg-[#FEF2F2] text-[#9F1239] border border-[#FECDD3] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#FEE2E2] transition-all flex items-center gap-2.5 shadow-sm group active:scale-95"
            >
              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />{" "}
              PDF Export
            </button>
            <button
              onClick={handleExportExcel}
              className="px-6 py-3 bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#DCFCE7] transition-all flex items-center gap-2.5 shadow-sm group active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />{" "}
              Excel Export
            </button>
          </div>
        </div>

        {activeTab === "dashboard" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ─── DASHBOARD HEADER (Analytical focus) ─── */}
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-50/50 rounded-full blur-3xl -mr-20 -mt-20 -z-10 group-hover:bg-violet-100/50 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    Performance Analytique
                  </h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Synthèse globale des opérations — Avril 2026
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-primary tracking-tighter">
                    28,450 €
                  </div>
                  <div className="text-[11px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest mt-2">
                    ▲ 12.5% vs mois dernier
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-8 mt-12">
                {[
                  {
                    label: "Taux Occupation",
                    value: "75.4%",
                    color: COLORS.violet,
                    change: "+2.1%",
                  },
                  {
                    label: "ADR (Tarif Moyen)",
                    value: "189€",
                    color: COLORS.blue,
                    change: "+5.2%",
                  },
                  {
                    label: "RevPAR",
                    value: "142.5€",
                    color: COLORS.emerald,
                    change: "+8.3%",
                  },
                  {
                    label: "Nuitées Vendues",
                    value: "1,240",
                    color: COLORS.amber,
                    change: "+18%",
                  },
                ].map((kpi, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {kpi.label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-800">
                        {kpi.value}
                      </span>
                      <span
                        className={`text-[9px] font-black ${kpi.color.text} ${kpi.color.light} px-2 py-0.5 rounded-full ring-1 ring-inset ${kpi.color.border.replace("#", "%23")}`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
                      <div
                        className={`h-full ${kpi.color.main} rounded-full`}
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── CHARTS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm flex flex-col h-[380px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Distribution
                  </h3>
                  <Globe className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 relative min-h-0">
                  <Doughnut data={channelChart} options={doughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Top Canal
                    </span>
                    <span className="text-lg font-black text-slate-800">
                      Booking
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4">
                  {channelChart.labels.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            channelChart.datasets[0].backgroundColor[i],
                        }}
                      />
                      <span className="text-[9px] font-bold text-slate-500">
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm flex flex-col h-[380px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Évolution Revenus Journaliers
                  </h3>
                  <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 min-h-0">
                  <Line
                    data={weeklyLineData}
                    options={{
                      ...options,
                      scales: {
                        ...options.scales,
                        y: { ...options.scales.y, display: true },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ─── ANALYTICAL REPORT PREVIEW (STA-10) ─── */}
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">
                      Performances par Nationalité
                    </h3>
                  </div>
                </div>
                <div className="text-[10px] font-black text-violet-600 bg-violet-100/50 px-4 py-2 rounded-xl uppercase tracking-widest border border-violet-100">
                  Total CA Consolidé : {totalAnalytics.total.toLocaleString()} €
                </div>
              </div>
              <div className="p-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-4">Pays / Nationalité</th>
                      <th className="pb-4 text-center">Nuits (PM)</th>
                      <th className="pb-4 text-right">Hébergement</th>
                      <th className="pb-4 text-right">Extra / F&B</th>
                      <th className="pb-4 text-right">TOTAL NET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 italic-rows">
                    {nationalityData.slice(0, 7).map((d, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="py-2 flex items-center gap-4">
                          <span
                            className={`fi fi-${d.flag} text-xl rounded shadow-sm border border-slate-100`}
                          ></span>
                          <span className="text-[12px] font-black text-slate-700">
                            {d.country}
                          </span>
                        </td>
                        <td className="py-2 text-center text-slate-500 font-bold text-[11px]">
                          {d.pm}
                        </td>
                        <td className="py-2 text-right text-slate-600 font-bold text-[11px]">
                          {d.stay.toLocaleString()} €
                        </td>
                        <td className="py-2 text-right text-slate-600 font-bold text-[11px]">
                          {d.fb.toLocaleString()} €
                        </td>
                        <td className="py-2 text-right">
                          <div className="bg-[#EDE9FE] rounded-[8px] px-3 py-1 shadow-sm inline-block group-hover:scale-105 transition-transform">
                            <span className="text-[12.5px] font-black text-[#6d28d9] tracking-tight">
                              {d.total.toLocaleString()} €
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => {
                    setActiveTab("allreports");
                    setActiveReport("STA-06 Nationalités & Pays");
                  }}
                  className="w-full mt-6 py-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all"
                >
                  Voir le rapport détaillé complet (STA-06)
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "apercu" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ApercuView
              nationalityData={nationalityData}
              totalAnalytics={totalAnalytics}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
            />
          </div>
        ) : (
          <div
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            ref={reportRef}
          >
            {/* ─── REPORT HEADER DISPLAY ─── */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[40px] p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                      {activeReport.split(" ")[0]}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                      Données synchronisées
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">
                    {activeReport.substring(
                      activeReport.split(" ")[0].length + 1,
                    )}
                  </h2>
                  <div className="flex items-center gap-4 mt-4 text-white/60">
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <Calendar className="w-3.5 h-3.5" /> Du 01/04/2026 au
                      30/04/2026
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <MapPin className="w-3.5 h-3.5" /> Mas Provençal Aix
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                    Orientation : PAYSAGE
                  </button>
                  <div className="text-[9px] font-black text-white/50 tracking-widest uppercase">
                    Flowtym Analytics System v4.0
                  </div>
                </div>
              </div>
            </div>

            {/* ─── TABLE CONTENT (Landscape optimized) ─── */}
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-md flex flex-col min-h-[600px]">
              {activeReport.includes("Nationalités") ? (
                <div className="flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-10 py-5">Pays / Origine</th>
                        <th className="px-8 py-5 text-center">Nuits</th>
                        <th className="px-8 py-5 text-right">CA Hébergement</th>
                        <th className="px-8 py-5 text-right">CA Extras</th>
                        <th className="px-8 py-5 text-right">Annulations</th>
                        <th className="px-10 py-5 text-right">Total Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 italic-rows">
                      {nationalityData.map((d, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-10 py-5 flex items-center gap-5">
                            <span
                              className={`fi fi-${d.flag} text-2xl rounded shadow-sm border border-slate-100`}
                            ></span>
                            <span className="text-[14px] font-black text-slate-700">
                              {d.country}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center text-slate-400 font-extrabold">
                            {d.pm}
                          </td>
                          <td className="px-8 py-5 text-right text-slate-600 font-bold">
                            {d.stay.toLocaleString()} €
                          </td>
                          <td className="px-8 py-5 text-right text-slate-600 font-bold">
                            {d.fb.toLocaleString()} €
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${d.cancels > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-300"}`}
                            >
                              {d.cancels}
                            </span>
                          </td>
                          <td className="px-10 py-5 text-right">
                            <div className="bg-[#EDE9FE] rounded-[12px] px-4 py-2 shadow-sm inline-block group-hover:scale-105 transition-transform">
                              <span className="text-[15px] font-black text-[#6d28d9] tracking-tight">
                                {d.total.toLocaleString()} €
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-10 py-5">Identifiant</th>
                          <th className="px-10 py-5">
                            Désignation de la transaction
                          </th>
                          <th className="px-8 py-5 text-center">
                            Quantité (Qté)
                          </th>
                          <th className="px-8 py-5 text-center">Statut</th>
                          <th className="px-10 py-5 text-right">
                            Valeur Unitaire / TTC
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px] font-bold italic-rows">
                        {paginatedData.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-10 py-1.5 text-slate-400 font-mono text-[10px]">
                              {r.col1}
                            </td>
                            <td className="px-10 py-1.5 text-slate-700">
                              {r.col2}
                            </td>
                            <td className="px-8 py-1.5 text-center text-slate-800">
                              {r.col3}
                            </td>
                            <td className="px-8 py-1.5 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.col4.includes("OK") || r.col4.includes("Journal") ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                              >
                                {r.col4}
                              </span>
                            </td>
                            <td className="px-10 py-1.5 text-right">
                              <div className="bg-violet-50 rounded-[8px] px-3 py-1 shadow-sm inline-block min-w-[90px] group-hover:bg-violet-100 transition-colors">
                                <span className="text-[12px] font-black text-violet-700">
                                  {fmt2(Number(r.col5))}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ─── PAGINATION ─── */}
                  <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Affichage :
                        </span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) =>
                            setItemsPerPage(Number(e.target.value))
                          }
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm cursor-pointer"
                        >
                          {[10, 20, 50, 100].map((v) => (
                            <option key={v} value={v}>
                              {v} / page
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-[10px] font-black text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                        <ClipboardList className="w-3 h-3 opacity-30" /> Total :{" "}
                        {genericMockData.length} indicateurs trouvés
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center px-4">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                          Page
                        </span>
                        <div className="mx-2 bg-primary text-white w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black shadow-lg shadow-primary/20">
                          {currentPage}
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                          / {totalPages}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const fmt2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );

