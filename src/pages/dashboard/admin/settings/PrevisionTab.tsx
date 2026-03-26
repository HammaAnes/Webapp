import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, Building2, Users, FileText, Target, Info,
  CalendarDays, Receipt, TrendingDown, Minus, Wallet, Flag,
} from "lucide-react";
import { useAppStore } from "../../../../store/store";
import { formatCurrency } from "../../../../utils/formatters";
import Card from "../../../../components/ui/Card";

// ── Constantes métier ──────────────────────────────────────────────────────────
const JOURS_OUVRABLES_MOIS       = 22;
const HEURES_PAR_JOUR            = 10;
const PRIX_DOMICILIATION         = 12_000;
const MAX_DOMICILIATIONS         = 60;
const BOX_TYPES                  = ["box_3", "box_4"] as const;
const OS_TYPE                    = "open_space" as const;
const OS_PLACES_MAX              = 12; // capacité max open space (abonnements)

// Fiscalité algérienne (LF 2024-2025, CIDTA)
const TVA_TAUX                   = 0.19;        // Taux TVA normal services
const TVA_BASE_DOM_PAR_CONTRAT   = 5_000;       // Base imposable fixe domiciliation (DA/contrat/mois)
const IBS_TAUX                   = 0.26;        // IBS prestations de services
const TA_TAUX                    = 0.01;        // Taxe d'Apprentissage (tous employeurs)
const TFP_TAUX                   = 0.01;        // Taxe Formation Professionnelle (≥ 20 salariés)
const TFP_SEUIL_SALARIES         = 20;
const CASNOS_TAUX                = 0.15;        // Cotisation gérant non-salarié
const CASNOS_MIN_ANNUEL          = 32_400;      // Minimum CASNOS/an
const CASNOS_MAX_ANNUEL          = 648_000;     // Plafond CASNOS/an
const CNRC_REDEVANCE_ANNUEL      = 5_000;       // Redevance annuelle CNRC (forfait)

// ── Types ──────────────────────────────────────────────────────────────────────
type Periode = "mois" | "trimestre" | "semestre" | "annee";

const PERIODES: { id: Periode; label: string; multi: number }[] = [
  { id: "mois",      label: "Mensuel",     multi: 1  },
  { id: "trimestre", label: "Trimestriel", multi: 3  },
  { id: "semestre",  label: "Semestriel",  multi: 6  },
  { id: "annee",     label: "Annuel",      multi: 12 },
];

const SCENARIOS: { label: string; taux: number; colorBg: string; colorText: string }[] = [
  { label: "Pessimiste", taux: 30, colorBg: "bg-red-50",     colorText: "text-red-600"     },
  { label: "Réaliste",   taux: 60, colorBg: "bg-amber-50",   colorText: "text-amber-600"   },
  { label: "Optimiste",  taux: 85, colorBg: "bg-emerald-50", colorText: "text-emerald-600" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function pct(value: number, total: number): string {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : "—";
}

function tarifJourEffectif(espace: { prixJour?: number; prixHeure?: number }): number {
  return espace.prixJour || (espace.prixHeure ?? 0) * HEURES_PAR_JOUR;
}

// Calcule la CASNOS mensuelle (annualisée puis divisée par 12)
function calcCasnosMensuel(beneficeAvantIbsAnnuel: number): number {
  if (beneficeAvantIbsAnnuel <= 0) return CASNOS_MIN_ANNUEL / 12;
  const assiette = Math.max(CASNOS_MIN_ANNUEL, Math.min(CASNOS_MAX_ANNUEL, beneficeAvantIbsAnnuel));
  return (assiette * CASNOS_TAUX) / 12;
}

const MoneyInput: React.FC<{
  label: string; value: number; onChange: (v: number) => void; hint?: string;
}> = ({ label, value, onChange, hint }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <input
        type="number" min={0} step={1000} value={value || ""} placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-right font-medium"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">DA</span>
    </div>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const Row: React.FC<{
  label: string; value: number; multi?: number; color?: string; bold?: boolean;
  sub?: string; negative?: boolean;
}> = ({ label, value, multi = 1, color = "text-gray-700", bold, sub, negative }) => (
  <div className={`flex items-baseline justify-between py-2 border-b border-gray-100 last:border-0 ${bold ? "font-semibold" : ""}`}>
    <div className="flex-1 min-w-0">
      <span className={`text-sm ${bold ? "text-gray-900" : "text-gray-600"}`}>{label}</span>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <span className={`text-sm ml-4 shrink-0 ${bold ? "text-base" : ""} ${color}`}>
      {negative ? "− " : ""}{formatCurrency(value * multi)}
    </span>
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────────
const PrevisionTab: React.FC = () => {
  const { espaces, abonnements, abonnementsUtilisateurs, demandesDomiciliation, initializeData } = useAppStore();

  // ── State revenus ──────────────────────────────────────────────────────────
  const [tauxEspaces, setTauxEspaces]           = useState(60);
  const [nbDomiciliations, setNbDomiciliations] = useState(0);
  const [abonnesParPlan, setAbonnesParPlan]     = useState<Record<string, number>>({});
  const [periode, setPeriode]                   = useState<Periode>("mois");
  const [loaded, setLoaded]                     = useState(false);
  const [tvaOption, setTvaOption]               = useState(false);

  // Lien plan → type d'espace consommé (pour déduire la capacité des journalières)
  const [planOccupation, setPlanOccupation] = useState<Record<string, "none" | "box" | "open_space">>({});

  // ── State charges ──────────────────────────────────────────────────────────
  const [loyer, setLoyer]                             = useState(0);
  const [chargesMall, setChargesMall]                 = useState(0);
  const [masseSalarialeBrute, setMasseSalarialeBrute] = useState(0); // salaires bruts employés/mois
  const [cotisationsPatronales, setCotisationsPatronales] = useState(0); // CNAS patronal/mois
  const [nbSalaries, setNbSalaries]                   = useState(0);
  const [gerantCasnos, setGerantCasnos]               = useState(true); // gérant non-salarié → CASNOS

  useEffect(() => { initializeData().then(() => setLoaded(true)); }, [initializeData]);

  useEffect(() => {
    if (!loaded) return;
    const activeDom = demandesDomiciliation.filter((d) => d.statut === "active").length;
    setNbDomiciliations(activeDom);
    const counts: Record<string, number> = {};
    abonnementsUtilisateurs.filter((a) => a.statut === "actif").forEach((a) => {
      counts[a.abonnementId] = (counts[a.abonnementId] || 0) + 1;
    });
    const init: Record<string, number> = {};
    abonnements.filter((a) => a.actif).forEach((a) => { init[a.id] = counts[a.id] || 0; });
    setAbonnesParPlan(init);
    // Auto-détection du type d'espace consommé depuis Abonnement.type
    const occ: Record<string, "none" | "box" | "open_space"> = {};
    abonnements.filter((a) => a.actif).forEach((a) => {
      const t = (a.type || "").toLowerCase();
      if (t.includes("box")) occ[a.id] = "box";
      else if (t.includes("open") || t.includes("coworking")) occ[a.id] = "open_space";
      else occ[a.id] = "none";
    });
    setPlanOccupation((prev) => ({ ...occ, ...prev })); // préserve les choix manuels
  }, [loaded, abonnements, abonnementsUtilisateurs, demandesDomiciliation]);

  // ── Calculs revenus ────────────────────────────────────────────────────────
  const espacesDisponibles = useMemo(() => espaces.filter((e) => e.disponible), [espaces]);

  // Capacité espaces occupée par les abonnements ─────────────────────────────
  const plansActifs = useMemo(() => abonnements.filter((a) => a.actif), [abonnements]);

  const boxEspaces  = useMemo(() => espacesDisponibles.filter((e) => (BOX_TYPES as readonly string[]).includes(e.type)), [espacesDisponibles]);
  const nbBoxTotal  = boxEspaces.length;
  const osEspace    = useMemo(() => espacesDisponibles.find((e) => e.type === OS_TYPE), [espacesDisponibles]);
  const osCapacite  = osEspace?.capacite ?? OS_PLACES_MAX;

  const nbBoxAbonnes = useMemo(() => Math.min(nbBoxTotal, plansActifs
    .filter((a) => (planOccupation[a.id] ?? "none") === "box")
    .reduce((s, a) => s + (abonnesParPlan[a.id] || 0), 0)
  ), [plansActifs, planOccupation, abonnesParPlan, nbBoxTotal]);

  const nbOSAbonnes = useMemo(() => Math.min(osCapacite, plansActifs
    .filter((a) => (planOccupation[a.id] ?? "none") === "open_space")
    .reduce((s, a) => s + (abonnesParPlan[a.id] || 0), 0)
  ), [plansActifs, planOccupation, abonnesParPlan, osCapacite]);

  const nbBoxLibres = nbBoxTotal - nbBoxAbonnes;
  const nbOSLibres  = osCapacite - nbOSAbonnes;

  // facteurCapacite : fraction de l'espace encore disponible pour les journalières
  const espacesDetail = useMemo(() =>
    espacesDisponibles.map((e) => {
      const tarifJour = tarifJourEffectif(e);
      let facteurCapacite = 1;
      if ((BOX_TYPES as readonly string[]).includes(e.type)) {
        facteurCapacite = nbBoxTotal > 0 ? nbBoxLibres / nbBoxTotal : 0;
      } else if (e.type === OS_TYPE) {
        facteurCapacite = osCapacite > 0 ? nbOSLibres / osCapacite : 0;
      }
      return {
        id: e.id, nom: e.nom, type: e.type,
        tarifJour,
        facteurCapacite,
        revenuMensuel: JOURS_OUVRABLES_MOIS * (tauxEspaces / 100) * tarifJour * facteurCapacite,
      };
    }),
  [espacesDisponibles, tauxEspaces, nbBoxLibres, nbBoxTotal, nbOSLibres, osCapacite]);

  const revenuEspacesMensuel     = useMemo(() => espacesDetail.reduce((s, e) => s + e.revenuMensuel, 0), [espacesDetail]);
  const revenuAbonnementsMensuel = useMemo(() => plansActifs.reduce((s, a) => s + (abonnesParPlan[a.id] || 0) * a.prix, 0), [plansActifs, abonnesParPlan]);
  const revenuDomiciliationsMensuel = nbDomiciliations * PRIX_DOMICILIATION;
  const totalRevenuMensuel          = revenuEspacesMensuel + revenuAbonnementsMensuel + revenuDomiciliationsMensuel;
  const totalAbonnes                = Object.values(abonnesParPlan).reduce((s, v) => s + v, 0);

  // ── Calculs TVA ────────────────────────────────────────────────────────────
  const tvaDomMensuel    = nbDomiciliations * TVA_BASE_DOM_PAR_CONTRAT * TVA_TAUX;
  const tvaOptionMensuel = tvaOption ? (revenuEspacesMensuel + revenuAbonnementsMensuel) * TVA_TAUX : 0;
  const totalTvaMensuel  = tvaDomMensuel + tvaOptionMensuel;

  // ── Calculs taxes sur salaires (déductibles IBS) ────────────────────────
  const taMensuel          = masseSalarialeBrute * TA_TAUX;
  const tfpMensuel         = nbSalaries >= TFP_SEUIL_SALARIES ? masseSalarialeBrute * TFP_TAUX : 0;
  const taxesSalairesMensuel = taMensuel + tfpMensuel;

  // ── Résultat avant IBS (base imposable) ───────────────────────────────────
  // CA HT − loyer − charges mall − masse salariale brute − cotisations patronales − TA − TFP − CNRC/12
  const chargesDeductiblesMensuel =
    loyer + chargesMall + masseSalarialeBrute + cotisationsPatronales +
    taxesSalairesMensuel + CNRC_REDEVANCE_ANNUEL / 12;

  const resultatAvantIbsMensuel = Math.max(0,
    totalRevenuMensuel - totalTvaMensuel - chargesDeductiblesMensuel
  );

  // ── IBS ────────────────────────────────────────────────────────────────────
  const ibsMensuel = resultatAvantIbsMensuel * IBS_TAUX;

  // ── Résultat après IBS ────────────────────────────────────────────────────
  const resultatApresIbsMensuel = resultatAvantIbsMensuel - ibsMensuel;

  // ── CASNOS (non déductible IBS, sur résultat annuel N-2, estimé ici sur base mensuelle × 12) ──
  const casnosMensuel = gerantCasnos
    ? calcCasnosMensuel(resultatAvantIbsMensuel * 12)
    : 0;

  // ── Ce qui reste dans la poche ─────────────────────────────────────────────
  const resteEnPocheMensuel = resultatApresIbsMensuel - casnosMensuel;

  // ── Point mort & Seuil de rentabilité ─────────────────────────────────────
  // Taux TVA applicable sur les revenus hors domiciliation (espaces + abonnements)
  const rTvaVar = tvaOption ? TVA_TAUX : 0;
  // Seuil opérationnel : CA brut minimum pour resultatAvantIbs = 0
  // Résolution analytique :
  //   CA × (1 − rTvaVar) = chargesDeductibles + tvaDom − CA_dom × rTvaVar
  //   CA = (chargesDeductibles + tvaDom − CA_dom × rTvaVar) / (1 − rTvaVar)
  const seuilAvantIbs = Math.max(0,
    (chargesDeductiblesMensuel + tvaDomMensuel - revenuDomiciliationsMensuel * rTvaVar) / (1 - rTvaVar)
  );
  // Seuil net : CA brut minimum pour poche = 0 (CASNOS au minimum si gérant)
  // résultatAvantIbs_cible = (CASNOS_min / 12) / (1 − IBS)
  const ibsCible = gerantCasnos ? (CASNOS_MIN_ANNUEL / 12) / (1 - IBS_TAUX) : 0;
  const seuilNet = Math.max(0,
    (ibsCible + chargesDeductiblesMensuel + tvaDomMensuel - revenuDomiciliationsMensuel * rTvaVar) / (1 - rTvaVar)
  );
  // Point mort en jours ouvrables du mois
  const pmJours = totalRevenuMensuel > 0
    ? Math.round((seuilAvantIbs / totalRevenuMensuel) * JOURS_OUVRABLES_MOIS)
    : JOURS_OUVRABLES_MOIS + 1;
  const pmNetJours = totalRevenuMensuel > 0
    ? Math.round((seuilNet / totalRevenuMensuel) * JOURS_OUVRABLES_MOIS)
    : JOURS_OUVRABLES_MOIS + 1;
  // Couverture et marge de sécurité
  const atteint    = seuilAvantIbs > 0 && totalRevenuMensuel >= seuilAvantIbs;
  const atteintNet = seuilNet      > 0 && totalRevenuMensuel >= seuilNet;
  const couverturePct = seuilAvantIbs > 0
    ? Math.min(100, Math.round((totalRevenuMensuel / seuilAvantIbs) * 100))
    : (totalRevenuMensuel > 0 ? 100 : 0);
  const margeSecuritePct = totalRevenuMensuel > 0 && seuilAvantIbs > 0
    ? Math.round(((totalRevenuMensuel - seuilAvantIbs) / totalRevenuMensuel) * 100)
    : 0;

  // ── Multiplicateur période ────────────────────────────────────────────────
  const multi = PERIODES.find((p) => p.id === periode)!.multi;

  // ── Scénarios : recalcule avec taux variable mais mêmes charges ──────────
  const calcPoche = (taux: number) => {
    // Même facteur de capacité que le calcul principal, taux de remplissage variable
    const espRev  = espacesDetail.reduce((s, e) => s + JOURS_OUVRABLES_MOIS * (taux / 100) * e.tarifJour * e.facteurCapacite, 0);
    const caTotal = espRev + revenuAbonnementsMensuel + revenuDomiciliationsMensuel;
    const tva     = tvaDomMensuel + (tvaOption ? (espRev + revenuAbonnementsMensuel) * TVA_TAUX : 0);
    const avant   = Math.max(0, caTotal - tva - chargesDeductiblesMensuel);
    const ibs     = avant * IBS_TAUX;
    const apres   = avant - ibs;
    const casnos  = gerantCasnos ? calcCasnosMensuel(avant * 12) : 0;
    return (apres - casnos) * multi;
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const periodeLabel = PERIODES.find((p) => p.id === periode)!.label.toLowerCase();

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prévisions & Estimation CA</h2>
          <p className="text-sm text-gray-500">
            Projection basée sur les tarifs réels, fiscalité algérienne (LF 2025) incluse
          </p>
        </div>
      </div>

      {/* Sélecteur période */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
          <CalendarDays className="w-4 h-4" /> Horizon :
        </span>
        {PERIODES.map((p) => (
          <button key={p.id} onClick={() => setPeriode(p.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              periode === p.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI revenus */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-emerald-500">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">CA brut</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenuMensuel * multi)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatCurrency(totalRevenuMensuel)} / mois</p>
        </Card>
        <Card className="p-5 border-l-4 border-blue-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Espaces</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(revenuEspacesMensuel * multi)}</p>
          <p className="text-xs text-gray-400 mt-1">{pct(revenuEspacesMensuel, totalRevenuMensuel)} du CA</p>
        </Card>
        <Card className="p-5 border-l-4 border-purple-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Abonnements</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{formatCurrency(revenuAbonnementsMensuel * multi)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalAbonnes} abonné{totalAbonnes !== 1 ? "s" : ""} · {pct(revenuAbonnementsMensuel, totalRevenuMensuel)}</p>
        </Card>
        <Card className="p-5 border-l-4 border-amber-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Domiciliations</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(revenuDomiciliationsMensuel * multi)}</p>
          <p className="text-xs text-gray-400 mt-1">{nbDomiciliations} contrat{nbDomiciliations !== 1 ? "s" : ""} · {pct(revenuDomiciliationsMensuel, totalRevenuMensuel)}</p>
        </Card>
      </div>

      {/* KPI résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-red-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Charges fixes</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency((loyer + chargesMall + masseSalarialeBrute + cotisationsPatronales) * multi)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatCurrency(loyer + chargesMall + masseSalarialeBrute + cotisationsPatronales)} / mois</p>
        </Card>
        <Card className="p-5 border-l-4 border-orange-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Impôts & taxes</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency((totalTvaMensuel + ibsMensuel + casnosMensuel + taxesSalairesMensuel + CNRC_REDEVANCE_ANNUEL / 12) * multi)}</p>
          <p className="text-xs text-gray-400 mt-1">TVA + IBS + CASNOS + TA/TFP</p>
        </Card>
        <Card className={`p-5 border-l-4 col-span-2 ${resteEnPocheMensuel >= 0 ? "border-teal-500" : "border-rose-500"}`}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ce qui reste dans la poche</p>
          <p className={`text-2xl font-bold mt-1 ${resteEnPocheMensuel >= 0 ? "text-teal-700" : "text-rose-600"}`}>
            {resteEnPocheMensuel >= 0 ? "+" : ""}{formatCurrency(resteEnPocheMensuel * multi)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatCurrency(resteEnPocheMensuel)} / mois · marge {pct(resteEnPocheMensuel, totalRevenuMensuel)}
          </p>
        </Card>
      </div>

      {/* Sliders revenus */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Espaces */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Taux de remplissage des espaces</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600">Occupation moyenne journalière</span>
              <span className="text-3xl font-extrabold text-blue-600">{tauxEspaces}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={tauxEspaces}
              onChange={(e) => setTauxEspaces(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
              style={{ background: `linear-gradient(to right, #2563eb ${tauxEspaces}%, #e5e7eb ${tauxEspaces}%)` }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-blue-800 font-semibold text-lg">{formatCurrency(revenuEspacesMensuel)} / mois</p>
            <p className="text-blue-500 text-xs mt-1">{espacesDisponibles.length} espace{espacesDisponibles.length !== 1 ? "s" : ""} · {JOURS_OUVRABLES_MOIS} jours/mois · {HEURES_PAR_JOUR}h/jour</p>
          </div>

          {/* Indicateurs capacité */}
          {(nbBoxTotal > 0 || osEspace) && (
            <div className="grid grid-cols-2 gap-3">
              {nbBoxTotal > 0 && (
                <div className={`rounded-xl p-3 text-center border ${nbBoxAbonnes > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                  <p className="text-xs text-gray-500 font-medium">Box libres</p>
                  <p className={`text-xl font-black mt-0.5 ${nbBoxLibres === 0 ? "text-red-600" : "text-gray-900"}`}>
                    {nbBoxLibres}<span className="text-sm font-normal text-gray-400">/{nbBoxTotal}</span>
                  </p>
                  {nbBoxAbonnes > 0 && <p className="text-xs text-amber-600">{nbBoxAbonnes} abonné{nbBoxAbonnes > 1 ? "s" : ""}</p>}
                </div>
              )}
              {osEspace && (
                <div className={`rounded-xl p-3 text-center border ${nbOSAbonnes > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                  <p className="text-xs text-gray-500 font-medium">Places OS libres</p>
                  <p className={`text-xl font-black mt-0.5 ${nbOSLibres === 0 ? "text-red-600" : "text-gray-900"}`}>
                    {nbOSLibres}<span className="text-sm font-normal text-gray-400">/{osCapacite}</span>
                  </p>
                  {nbOSAbonnes > 0 && <p className="text-xs text-amber-600">{nbOSAbonnes} abonné{nbOSAbonnes > 1 ? "s" : ""}</p>}
                </div>
              )}
            </div>
          )}

          {espacesDetail.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Détail par espace</p>
              {espacesDetail.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.nom}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(e.tarifJour)}/jour</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-blue-700">{formatCurrency(e.revenuMensuel)}/mois</span>
                    {e.facteurCapacite < 1 && (
                      <p className="text-xs text-amber-600">{Math.round(e.facteurCapacite * 100)}% dispo</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Domiciliations */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Domiciliations actives</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-600">Nombre de contrats</span>
                <span className="text-3xl font-extrabold text-amber-600">{nbDomiciliations}</span>
              </div>
              <input type="range" min={0} max={MAX_DOMICILIATIONS} step={1} value={nbDomiciliations}
                onChange={(e) => setNbDomiciliations(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-500"
                style={{ background: `linear-gradient(to right, #d97706 ${(nbDomiciliations / MAX_DOMICILIATIONS) * 100}%, #e5e7eb ${(nbDomiciliations / MAX_DOMICILIATIONS) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span><span>15</span><span>30</span><span>45</span><span>{MAX_DOMICILIATIONS}</span>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-amber-800 font-semibold text-lg">{formatCurrency(revenuDomiciliationsMensuel)} / mois</p>
              <p className="text-amber-500 text-xs mt-1">{nbDomiciliations} × {formatCurrency(PRIX_DOMICILIATION)}/mois</p>
            </div>
          </Card>

          {/* Abonnements */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Abonnements</h3>
            </div>
            {plansActifs.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun plan actif configuré</p>
            ) : (
              <div className="space-y-5">
                {plansActifs.map((a) => {
                  const occ   = planOccupation[a.id] ?? "none";
                  const maxNb = occ === "box" ? nbBoxTotal : occ === "open_space" ? osCapacite : 50;
                  const nb    = Math.min(abonnesParPlan[a.id] || 0, maxNb);
                  const pct   = maxNb > 0 ? (nb / maxNb) * 100 : 0;
                  return (
                    <div key={a.id} className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-sm font-medium text-gray-800">{a.nom}</span>
                          <span className="text-xs text-gray-400 ml-2">{formatCurrency(a.prix)}/mois</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-purple-700">{nb}</span>
                          <span className="text-xs text-purple-400 ml-1">/ {maxNb} max</span>
                        </div>
                      </div>
                      {/* Sélecteur espace consommé */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-400">Occupe :</span>
                        {(["none", "box", "open_space"] as const).map((opt) => (
                          <button key={opt}
                            onClick={() => setPlanOccupation((p) => ({ ...p, [a.id]: opt }))}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              occ === opt
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}>
                            {opt === "none" ? "Aucun espace" : opt === "box" ? "Un box" : "Une place OS"}
                          </button>
                        ))}
                      </div>
                      <input type="range" min={0} max={maxNb} step={1} value={nb}
                        onChange={(e) => setAbonnesParPlan((p) => ({ ...p, [a.id]: Number(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-600"
                        style={{ background: `linear-gradient(to right, #9333ea ${pct}%, #e5e7eb ${pct}%)` }}
                      />
                      <p className="text-xs text-right text-purple-600 font-medium">= {formatCurrency(nb * a.prix)}/mois</p>
                    </div>
                  );
                })}
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-purple-800 font-semibold text-lg">{formatCurrency(revenuAbonnementsMensuel)} / mois</p>
                  <p className="text-purple-500 text-xs mt-1">{totalAbonnes} abonné{totalAbonnes !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Charges fixes ─────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Charges fixes mensuelles</h3>
          </div>
          <span className="text-sm font-semibold text-red-600">
            {formatCurrency((loyer + chargesMall + masseSalarialeBrute + cotisationsPatronales) * multi)} / {periodeLabel.split(" ")[0]}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyInput label="Loyer mensuel" value={loyer} onChange={setLoyer} hint="Loyer du local" />
          <MoneyInput label="Charges du mall" value={chargesMall} onChange={setChargesMall} hint="Charges communes, services" />
          <MoneyInput label="Masse salariale brute" value={masseSalarialeBrute} onChange={setMasseSalarialeBrute} hint="Salaires bruts versés aux employés (sert aussi au calcul TA/TFP)" />
          <MoneyInput label="Cotisations patronales (CNAS)" value={cotisationsPatronales} onChange={setCotisationsPatronales} hint="Charges sociales patronales (~26% du salaire brut)" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre de salariés</label>
            <div className="flex items-center gap-3">
              <input type="number" min={0} step={1} value={nbSalaries || ""} placeholder="0"
                onChange={(e) => setNbSalaries(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-right font-medium"
              />
              <span className="text-xs text-gray-500">
                {nbSalaries >= TFP_SEUIL_SALARIES
                  ? <span className="text-orange-600 font-medium">≥ {TFP_SEUIL_SALARIES} → TA + TFP applicables</span>
                  : <span className="text-gray-400">{"< "}{TFP_SEUIL_SALARIES} → seule la TA s'applique</span>}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Gérant non-salarié (CASNOS)</p>
              <p className="text-xs text-gray-400">Décocher si gérant déclaré à la CNAS</p>
            </div>
            <button onClick={() => setGerantCasnos((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${gerantCasnos ? "bg-gray-800" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${gerantCasnos ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* ── TVA ──────────────────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">TVA</h3>
          <span className="ml-auto text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">Taux 19%</span>
        </div>

        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-800">TVA domiciliation <span className="font-normal">(toujours applicable)</span></p>
              <p className="text-xs text-orange-600 mt-0.5">
                Base imposable fixe {formatCurrency(TVA_BASE_DOM_PAR_CONTRAT)} × {nbDomiciliations} contrat{nbDomiciliations !== 1 ? "s" : ""}
                {" = "}{formatCurrency(nbDomiciliations * TVA_BASE_DOM_PAR_CONTRAT)} imposable/mois
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-orange-700">{formatCurrency(tvaDomMensuel)} / mois</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-4 transition-colors ${tvaOption ? "border-orange-200 bg-orange-50/50" : "border-gray-100 bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">TVA sur option <span className="font-normal text-gray-500">(espaces + abonnements)</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Si l'entreprise opte pour la TVA sur ces revenus</p>
            </div>
            <button onClick={() => setTvaOption((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${tvaOption ? "bg-orange-500" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${tvaOption ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {tvaOption && (
            <div className="mt-3 space-y-1 text-sm border-t border-orange-200 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Espaces ({formatCurrency(revenuEspacesMensuel)}/mois × 19%)</span>
                <span className="font-medium text-orange-700">{formatCurrency(revenuEspacesMensuel * TVA_TAUX)}/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Abonnements ({formatCurrency(revenuAbonnementsMensuel)}/mois × 19%)</span>
                <span className="font-medium text-orange-700">{formatCurrency(revenuAbonnementsMensuel * TVA_TAUX)}/mois</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-900 text-white px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Total TVA collectée</p>
            <p className="text-xs text-gray-400 mt-0.5">À reverser mensuellement (G50)</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCurrency(totalTvaMensuel)} / mois</p>
            <p className="text-xs text-gray-400">{formatCurrency(totalTvaMensuel * multi)} sur la période</p>
          </div>
        </div>
      </Card>

      {/* ── Cascade fiscale ─────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Cascade fiscale</h3>
          <span className="text-xs text-gray-400 ml-1">({periodeLabel})</span>
        </div>

        {/* CA */}
        <Row label="CA brut" value={totalRevenuMensuel} multi={multi} color="text-gray-900" bold />

        {/* TVA */}
        <Row label="TVA collectée" value={totalTvaMensuel} multi={multi} color="text-orange-600"
          sub={`Dom. ${formatCurrency(tvaDomMensuel)}/mois${tvaOption ? " + option" : ""}`} negative />

        {/* Charges fixes */}
        <div className="py-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">Charges d'exploitation</p>
        </div>
        <Row label="Loyer" value={loyer} multi={multi} color="text-red-600" negative />
        <Row label="Charges du mall" value={chargesMall} multi={multi} color="text-red-600" negative />
        <Row label="Masse salariale brute" value={masseSalarialeBrute} multi={multi} color="text-red-600" negative />
        <Row label="Cotisations patronales (CNAS)" value={cotisationsPatronales} multi={multi} color="text-red-600" negative />

        {/* Taxes sur salaires */}
        <Row label={`Taxe d'apprentissage (TA — 1% masse salariale)`}
          value={taMensuel} multi={multi} color="text-orange-600"
          sub="Déductible de l'IBS" negative />
        {nbSalaries >= TFP_SEUIL_SALARIES && (
          <Row label="Taxe de formation professionnelle (TFP — 1%)"
            value={tfpMensuel} multi={multi} color="text-orange-600"
            sub="Déductible de l'IBS" negative />
        )}
        <Row label="Redevance CNRC"
          value={CNRC_REDEVANCE_ANNUEL / 12} multi={multi} color="text-orange-600"
          sub={`${formatCurrency(CNRC_REDEVANCE_ANNUEL)}/an — forfait`} negative />

        {/* Résultat avant IBS */}
        <div className="border-t-2 border-gray-200 pt-3 mt-2">
          <Row label="Résultat avant IBS (base imposable)"
            value={resultatAvantIbsMensuel} multi={multi} color="text-gray-900" bold />
        </div>

        {/* IBS */}
        <Row label={`IBS (${Math.round(IBS_TAUX * 100)}% — prestations de services)`}
          value={ibsMensuel} multi={multi} color="text-red-700"
          sub="Impôt sur les bénéfices des sociétés" negative />

        {/* Résultat après IBS */}
        <div className="border-t-2 border-gray-200 pt-3 mt-2">
          <Row label="Résultat après IBS"
            value={resultatApresIbsMensuel} multi={multi} color="text-gray-900" bold />
        </div>

        {/* CASNOS */}
        {gerantCasnos && (
          <Row label={`CASNOS gérant (${Math.round(CASNOS_TAUX * 100)}% — non déductible IBS)`}
            value={casnosMensuel} multi={multi} color="text-red-700"
            sub={`Min. ${formatCurrency(CASNOS_MIN_ANNUEL)}/an · calculé sur base annualisée`} negative />
        )}

        {/* Ce qui reste */}
        <div className={`border-t-2 pt-3 mt-2 ${resteEnPocheMensuel >= 0 ? "border-teal-300" : "border-rose-300"}`}>
          <div className="flex items-baseline justify-between">
            <span className={`text-base font-bold ${resteEnPocheMensuel >= 0 ? "text-teal-800" : "text-rose-700"}`}>
              Ce qui reste dans la poche
            </span>
            <span className={`text-2xl font-black ${resteEnPocheMensuel >= 0 ? "text-teal-700" : "text-rose-600"}`}>
              {resteEnPocheMensuel >= 0 ? "+" : ""}{formatCurrency(resteEnPocheMensuel * multi)}
            </span>
          </div>
          {totalRevenuMensuel > 0 && (
            <p className={`text-xs text-right mt-1 ${resteEnPocheMensuel >= 0 ? "text-teal-500" : "text-rose-400"}`}>
              Marge nette : {pct(resteEnPocheMensuel, totalRevenuMensuel)} du CA brut
            </p>
          )}
        </div>
      </Card>

      {/* ── Point mort & Seuil de rentabilité ──────────────────────────────── */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Point mort & Seuil de rentabilité</h3>
        </div>

        {/* Seuils */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`rounded-xl p-4 border ${atteint ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Seuil opérationnel <span className="font-normal">(avant IBS)</span></p>
            <p className={`text-xl font-bold ${atteint ? "text-emerald-700" : "text-red-600"}`}>
              {formatCurrency(seuilAvantIbs)} / mois
            </p>
            {seuilAvantIbs === 0 ? (
              <p className="text-xs text-emerald-600 mt-1">✓ Aucune charge — toujours rentable</p>
            ) : atteint ? (
              <p className="text-xs text-emerald-700 mt-1">
                ✓ Atteint — point mort au jour {Math.min(pmJours, JOURS_OUVRABLES_MOIS)} / {JOURS_OUVRABLES_MOIS}
              </p>
            ) : (
              <p className="text-xs text-red-600 mt-1">
                ✗ Non atteint — manque {formatCurrency(seuilAvantIbs - totalRevenuMensuel)}
              </p>
            )}
          </div>

          <div className={`rounded-xl p-4 border ${atteintNet ? "bg-teal-50 border-teal-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Seuil net <span className="font-normal">(après toutes taxes)</span></p>
            <p className={`text-xl font-bold ${atteintNet ? "text-teal-700" : "text-red-600"}`}>
              {formatCurrency(seuilNet)} / mois
            </p>
            {seuilNet === 0 ? (
              <p className="text-xs text-teal-600 mt-1">✓ Aucune charge — toujours rentable</p>
            ) : atteintNet ? (
              <p className="text-xs text-teal-700 mt-1">
                ✓ Atteint — point mort net au jour {Math.min(pmNetJours, JOURS_OUVRABLES_MOIS)} / {JOURS_OUVRABLES_MOIS}
              </p>
            ) : (
              <p className="text-xs text-red-600 mt-1">
                ✗ Non atteint — manque {formatCurrency(seuilNet - totalRevenuMensuel)}
              </p>
            )}
          </div>
        </div>

        {/* Barre de couverture */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Couverture du seuil opérationnel</p>
            <p className={`text-sm font-bold ${atteint ? "text-emerald-600" : "text-red-600"}`}>
              {couverturePct}%
              {margeSecuritePct !== 0 && (
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (marge {margeSecuritePct > 0 ? "+" : ""}{margeSecuritePct}%)
                </span>
              )}
            </p>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${atteint ? "bg-emerald-500" : "bg-red-400"}`}
              style={{ width: `${couverturePct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0 DA</span>
            <span className="font-medium text-gray-500">Seuil : {formatCurrency(seuilAvantIbs)}</span>
            {atteint && totalRevenuMensuel > seuilAvantIbs && (
              <span className="text-emerald-600">CA actuel : {formatCurrency(totalRevenuMensuel)}</span>
            )}
          </div>
        </div>

        {/* Point mort en jours */}
        {totalRevenuMensuel > 0 && seuilAvantIbs > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Point mort opérationnel</p>
              <p className={`text-2xl font-black mt-1 ${pmJours <= JOURS_OUVRABLES_MOIS ? "text-gray-900" : "text-red-500"}`}>
                {pmJours <= JOURS_OUVRABLES_MOIS ? `J${pmJours}` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pmJours <= JOURS_OUVRABLES_MOIS
                  ? `sur ${JOURS_OUVRABLES_MOIS} j. ouvrables / mois`
                  : "Non atteint au CA actuel"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Point mort net</p>
              <p className={`text-2xl font-black mt-1 ${pmNetJours <= JOURS_OUVRABLES_MOIS ? "text-gray-900" : "text-red-500"}`}>
                {pmNetJours <= JOURS_OUVRABLES_MOIS ? `J${pmNetJours}` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pmNetJours <= JOURS_OUVRABLES_MOIS
                  ? `sur ${JOURS_OUVRABLES_MOIS} j. ouvrables / mois`
                  : "Non atteint au CA actuel"}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Scénarios */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Comparaison de scénarios</h3>
          <span className="text-xs text-gray-400">(ce qui reste dans la poche — cliquez pour appliquer)</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {SCENARIOS.map((s) => {
            const poche   = calcPoche(s.taux);
            const isActive = tauxEspaces === s.taux;
            return (
              <button key={s.label} onClick={() => setTauxEspaces(s.taux)}
                className={`rounded-2xl p-5 text-center transition-all border-2 cursor-pointer ${
                  isActive
                    ? `${s.colorBg} border-current ${s.colorText} shadow-sm`
                    : "bg-gray-50 border-transparent hover:border-gray-200 text-gray-600"
                }`}>
                <p className={`text-xs font-semibold uppercase tracking-widest ${isActive ? s.colorText : "text-gray-400"}`}>{s.label}</p>
                <p className={`text-3xl font-black mt-2 ${isActive ? s.colorText : "text-gray-700"}`}>{s.taux}%</p>
                <p className={`text-base font-bold mt-2 ${poche >= 0 ? (isActive ? s.colorText : "text-gray-700") : "text-rose-600"}`}>
                  {poche >= 0 ? "+" : ""}{formatCurrency(poche)}
                </p>
                <p className="text-xs text-gray-400 mt-1">dans la poche · {periodeLabel}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Note */}
      <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 text-xs text-gray-500">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
        <div className="leading-relaxed space-y-1">
          <p>
            <strong className="text-gray-600">Fiscalité appliquée (LF 2025, CIDTA) :</strong>{" "}
            IBS 26% (prestations de services) · TA 1% masse salariale · TFP 1% si ≥ {TFP_SEUIL_SALARIES} salariés
            (déductibles IBS) · CASNOS gérant 15% (min {formatCurrency(CASNOS_MIN_ANNUEL)}/an, non déductible IBS)
            · CNRC {formatCurrency(CNRC_REDEVANCE_ANNUEL)}/an · TVA 19%.
            TAP supprimée depuis LF 2024.
          </p>
          <p>
            <strong className="text-gray-600">Méthode :</strong>{" "}
            CA espaces = tarif journée × {JOURS_OUVRABLES_MOIS} jours/mois × taux remplissage.
            TVA domiciliation sur base imposable fixe de {formatCurrency(TVA_BASE_DOM_PAR_CONTRAT)}/contrat/mois.
            Ces projections sont indicatives — consulter un comptable pour la déclaration fiscale réelle.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrevisionTab;
