import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building, User, FileText, Mail, Package, CheckCircle, XCircle, Scale,
  Ban, PlayCircle, AlertCircle, Save, Plus, Loader2, StickyNote, Briefcase,
  Pencil, X, FileCheck, Eye, Download, Upload, Trash2, File, RefreshCw,
  ArrowLeft, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import { apiClient } from "../../../lib/api-client";
import { useAppStore } from "../../../store/store";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { DOMICILIATION_STATUT_LABELS } from "../../../constants";
import { emailService } from "../../../services/email-service";
import type { DemandeDomiciliation } from "../../../types";
import {
  type DocumentRecord,
  SOCIETE_DOCS,
  AUTO_ENTREPRENEUR_DOCS,
  COMMON_DOCS,
  loadDocumentsFromApi,
  triggerDocumentDownload,
  openDocumentPreview,
  formatFileSize,
} from "../../../components/domiciliation/DocumentsEntreprise";
import {
  REQUIRED_DOCS_NEW_SOCIETE,
  REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR,
  REQUIRED_DOCS_EXISTING_SOCIETE,
  REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR,
} from "../../../components/domiciliation/constants";

type TabId = "informations" | "contrat" | "courrier" | "documents" | "notes" | "actions";

interface CourrierItem {
  id: string;
  type: string;
  expediteur: string;
  description: string;
  statut: string;
  date_reception?: string;
  dateReception?: string;
  date_retrait?: string;
  dateRetrait?: string;
  retire_par?: string;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "informations", label: "Informations", icon: Building },
  { id: "contrat", label: "Contrat", icon: FileCheck },
  { id: "courrier", label: "Courrier", icon: Mail },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "actions", label: "Actions", icon: Scale },
];

const STATUS_BADGES: Record<string, { variant: "warning" | "success" | "danger" | "default" | "info" | "teal"; label: string }> = {
  dossier_preparatoire: { variant: "warning", label: "Dossier preparatoire" },
  en_attente_signature: { variant: "info", label: "Attente signature" },
  domiciliation_creee: { variant: "teal", label: "Domiciliation creee" },
  en_attente_complements: { variant: "warning", label: "Attente complements" },
  active: { variant: "success", label: "Active" },
  refusee: { variant: "danger", label: "Refusee" },
  expiree: { variant: "default", label: "Expiree" },
  resiliee: { variant: "danger", label: "Resiliee" },
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
    <p className="font-medium text-gray-900 text-sm">{value || "-"}</p>
  </div>
);

const SectionHeader = ({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h4 className="font-bold text-gray-900 text-base">{title}</h4>
  </div>
);

export default function DomiciliationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { demandesDomiciliation, loadDemandesDomiciliation } = useAppStore();
  const [demande, setDemande] = useState<DemandeDomiciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("informations");
  const [courrierCount, setCourrierCount] = useState(0);

  const loadDemande = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await loadDemandesDomiciliation();
    const fresh = useAppStore.getState().demandesDomiciliation;
    const found = fresh.find((d) => d.id === id);
    if (found) setDemande(found);
    else toast.error("Domiciliation introuvable");
    setLoading(false);
  }, [id, loadDemandesDomiciliation]);

  useEffect(() => { loadDemande(); }, [loadDemande]);

  useEffect(() => {
    if (demande?.id) {
      apiClient.getUserCourrier(demande.id).then((r) => {
        const data = r.data as Record<string, unknown> | undefined;
        const courriers = ((data?.courriers || []) as CourrierItem[]);
        setCourrierCount(courriers.filter((c) => !["retire", "envoye", "archive"].includes(c.statut)).length);
      }).catch(() => setCourrierCount(0));
    }
  }, [demande?.id]);

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    if (!demande) return;
    setActionLoading(true);
    try {
      let response;
      const motif = (data?.motif as string) || "";
      switch (action) {
        case "valider":
          response = await apiClient.validateDomiciliation(demande.id, motif || undefined);
          break;
        case "rejeter":
          response = await apiClient.rejectDomiciliation(demande.id, motif);
          break;
        case "signer":
          response = await apiClient.updateDemandeDomiciliation(demande.id, {
            statut: "domiciliation_creee",
            numeroBureau: data?.numeroBureau as number,
            referenceContratNotarie: data?.referenceContratNotarie as string,
            dateDebutContrat: data?.dateDebutContrat as string,
            dateFinContrat: data?.dateFinContrat as string,
            montantMensuel: data?.montantMensuel as number,
          });
          break;
        case "completer":
        case "activer":
          response = await apiClient.activateDomiciliation(demande.id);
          break;
        case "resilier":
          response = await apiClient.updateDemandeDomiciliation(demande.id, {
            statut: "resiliee",
            commentaireAdmin: motif,
          });
          break;
        default:
          return;
      }
      if (response?.success) {
        const msgs: Record<string, string> = {
          valider: "Dossier valide - en attente de signature notariale",
          rejeter: "Demande refusee",
          signer: "Domiciliation creee - contrat enregistre",
          completer: "Domiciliation activee",
          activer: "Domiciliation activee",
          resilier: "Domiciliation resiliee",
        };
        toast.success(msgs[action] || "Action effectuee");
        const email = demande.representantLegal?.email;
        if (email) {
          const statusMap: Record<string, string> = {
            valider: "en_attente_signature", rejeter: "refusee",
            signer: "domiciliation_creee", completer: "active",
            activer: "active", resilier: "resiliee",
          };
          const newStatut = statusMap[action];
          emailService.onDomiciliationStatusUpdate(email, {
            prenom: demande.representantLegal?.prenom || "",
            raisonSociale: demande.raisonSociale || "",
            formeJuridique: demande.formeJuridique,
            statut: newStatut,
            statutLabel: (DOMICILIATION_STATUT_LABELS as Record<string, string>)[newStatut] || newStatut,
            montantMensuel: action === "signer" ? (data?.montantMensuel as number) : demande.montantMensuel,
            commentaire: motif || undefined,
            dateDebut: action === "signer" ? (data?.dateDebutContrat as string) : undefined,
            dateFin: action === "signer" ? (data?.dateFinContrat as string) : undefined,
          });
        }
        await loadDemandesDomiciliation();
        const fresh = useAppStore.getState().demandesDomiciliation;
        const updated = fresh.find((d) => d.id === demande.id);
        if (updated) setDemande(updated);
      } else {
        toast.error(response?.error || "Une erreur est survenue");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du traitement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!demande) return;
    setActionLoading(true);
    try {
      const response = await apiClient.updateDemandeDomiciliation(demande.id, data);
      if (response?.success) {
        toast.success("Domiciliation mise a jour");
        await loadDemandesDomiciliation();
        const fresh = useAppStore.getState().demandesDomiciliation;
        const updated = fresh.find((d) => d.id === demande.id);
        if (updated) setDemande(updated);
      } else {
        const msg = response?.error || "Erreur lors de la mise a jour";
        toast.error(msg);
        throw new Error(msg);
      }
    } catch (err) {
      if (!(err instanceof Error && err.message.includes("Erreur"))) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de la mise a jour");
      }
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="text-center py-32">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Domiciliation introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/admin/domiciliations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour a la liste
        </Button>
      </div>
    );
  }

  const badge = STATUS_BADGES[demande.statut] || STATUS_BADGES.dossier_preparatoire;
  const displayName = demande.raisonSociale || `${demande.representantLegal?.prenom || ""} ${demande.representantLegal?.nom || ""}`.trim() || "Non renseigne";
  const rep = demande.representantLegal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/app/admin/domiciliations")} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                {demande.numeroBureau && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Bureau N{demande.numeroBureau}
                  </span>
                )}
                {demande.typeStructure === "auto_entrepreneur" ? (
                  <Badge variant="default" size="sm">Auto-entrepreneur</Badge>
                ) : (
                  <Badge variant="default" size="sm">{demande.formeJuridique || "Societe"}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500 flex-shrink-0 hidden md:block">
          {rep?.email && <p>{rep.email}</p>}
          {rep?.telephone && <p>{rep.telephone}</p>}
          {demande.dateCreation && <p className="mt-1 text-xs">Cree le {formatDate(demande.dateCreation)}</p>}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "courrier" && courrierCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {courrierCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-[50vh]">
        {activeTab === "informations" && <InformationsTab demande={demande} onUpdate={handleUpdate} loading={actionLoading} />}
        {activeTab === "contrat" && <ContratTab demande={demande} onUpdate={handleUpdate} loading={actionLoading} />}
        {activeTab === "courrier" && <CourrierTab demande={demande} />}
        {activeTab === "documents" && <DocumentsTab demande={demande} />}
        {activeTab === "notes" && <NotesTab demande={demande} onUpdate={handleUpdate} loading={actionLoading} />}
        {activeTab === "actions" && <ActionsTab demande={demande} onAction={handleAction} loading={actionLoading} />}
      </div>
    </div>
  );
}

function InformationsTab({ demande, onUpdate, loading }: { demande: DemandeDomiciliation; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [editing, setEditing] = useState(false);
  const rep = demande.representantLegal || {};
  const initForm = useCallback(() => ({
    raisonSociale: demande.raisonSociale || "",
    formeJuridique: demande.formeJuridique || "",
    nif: demande.nif || "",
    nis: demande.nis || "",
    registreCommerce: demande.registreCommerce || "",
    articleImposition: demande.articleImposition || "",
    codeNae: demande.codeNae || "",
    activiteExercee: demande.activiteExercee || "",
    numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur || "",
    repNom: rep.nom || "",
    repPrenom: rep.prenom || "",
    repTel: rep.telephone || "",
    repEmail: rep.email || "",
    repVille: rep.ville || "",
    repAdresse: rep.adresseResidence || "",
  }), [demande, rep]);
  const [form, setForm] = useState(initForm);
  useEffect(() => { setForm(initForm()); }, [initForm]);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    try {
      await onUpdate({
        raisonSociale: form.raisonSociale,
        formeJuridique: form.formeJuridique,
        nif: form.nif,
        nis: form.nis,
        registreCommerce: form.registreCommerce,
        articleImposition: form.articleImposition,
        codeNae: form.codeNae,
        activiteExercee: form.activiteExercee,
        numeroAutoEntrepreneur: form.numeroAutoEntrepreneur,
        representantLegal: {
          nom: form.repNom,
          prenom: form.repPrenom,
          telephone: form.repTel,
          email: form.repEmail,
          ville: form.repVille,
          adresseResidence: form.repAdresse,
        },
      });
      setEditing(false);
    } catch {
      /* error already toasted */
    }
  };

  const isSociete = demande.typeStructure === "societe";
  const isAE = demande.typeStructure === "auto_entrepreneur";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" variant={editing ? "danger" : "outline"} onClick={() => setEditing(!editing)}>
          {editing ? <><X className="w-4 h-4" /> Annuler</> : <><Pencil className="w-4 h-4" /> Modifier</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Situation</p>
          <p className="font-semibold text-amber-900 text-sm mt-1">
            {demande.situationAdministrative === "en_cours_creation" ? "En cours de creation" : "Deja creee"}
          </p>
        </div>
        <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
          <p className="text-xs text-sky-700 uppercase tracking-wide font-semibold">Type</p>
          <p className="font-semibold text-sky-900 text-sm mt-1">{isAE ? "Auto-entrepreneur" : "Societe"}</p>
        </div>
      </div>

      <div>
        <SectionHeader icon={Briefcase} title="Entreprise" color="from-amber-500 to-orange-500" />
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Raison sociale" value={form.raisonSociale} onChange={(e) => set("raisonSociale", e.target.value)} />
            <Input label="Forme juridique" value={form.formeJuridique} onChange={(e) => set("formeJuridique", e.target.value)} />
            <Input label="NIF" value={form.nif} onChange={(e) => set("nif", e.target.value)} maxLength={20} />
            <Input label="NIS" value={form.nis} onChange={(e) => set("nis", e.target.value)} maxLength={15} />
            <Input label="Registre Commerce" value={form.registreCommerce} onChange={(e) => set("registreCommerce", e.target.value)} />
            <Input label="Article Imposition" value={form.articleImposition} onChange={(e) => set("articleImposition", e.target.value)} />
            {isAE && (
              <>
                <Input label="Activite exercee" value={form.activiteExercee} onChange={(e) => set("activiteExercee", e.target.value)} />
                <Input label="N. Auto-entrepreneur" value={form.numeroAutoEntrepreneur} onChange={(e) => set("numeroAutoEntrepreneur", e.target.value)} />
              </>
            )}
            {isSociete && <Input label="Code NAE" value={form.codeNae} onChange={(e) => set("codeNae", e.target.value)} />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Raison sociale" value={demande.raisonSociale} />
            <Field label="Forme juridique" value={demande.formeJuridique} />
            {isSociete && (
              <>
                <Field label="NIF" value={demande.nif || ""} />
                <Field label="NIS" value={demande.nis || ""} />
                <Field label="Registre Commerce" value={demande.registreCommerce || ""} />
                <Field label="Article Imposition" value={demande.articleImposition || ""} />
                <Field label="Code NAE" value={demande.codeNae || ""} />
              </>
            )}
            {isAE && (
              <>
                <Field label="Activite exercee" value={demande.activiteExercee || ""} />
                <Field label="N. Auto-entrepreneur" value={demande.numeroAutoEntrepreneur || ""} />
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <SectionHeader icon={User} title="Representant Legal" color="from-sky-500 to-cyan-500" />
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Prenom" value={form.repPrenom} onChange={(e) => set("repPrenom", e.target.value)} />
            <Input label="Nom" value={form.repNom} onChange={(e) => set("repNom", e.target.value)} />
            <Input label="Telephone" value={form.repTel} onChange={(e) => set("repTel", e.target.value)} />
            <Input label="Email" value={form.repEmail} onChange={(e) => set("repEmail", e.target.value)} />
            <Input label="Ville" value={form.repVille} onChange={(e) => set("repVille", e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Adresse" value={form.repAdresse} onChange={(e) => set("repAdresse", e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Nom complet" value={`${rep.prenom || ""} ${rep.nom || ""}`} />
            <Field label="Telephone" value={rep.telephone || ""} />
            <Field label="Email" value={rep.email || ""} />
            <Field label="Ville" value={rep.ville || ""} />
            {rep.adresseResidence && <Field label="Adresse" value={rep.adresseResidence} />}
          </div>
        )}
      </div>

      {demande.options && (
        <div>
          <SectionHeader icon={CheckCircle} title="Options selectionnees" color="from-teal-500 to-emerald-500" />
          <div className="flex flex-wrap gap-2">
            {demande.options.domiciliationSimple && <Badge variant="success">Domiciliation simple</Badge>}
            {demande.options.receptionCourrier && <Badge variant="info">Reception courrier</Badge>}
            {demande.options.scanNotificationEmail && <Badge variant="info">Scan email</Badge>}
            {demande.options.reexpeditionCourrier && <Badge variant="info">Reexpedition</Badge>}
            {demande.options.accesPonctuelEspaces && <Badge variant="teal">Acces espaces</Badge>}
          </div>
        </div>
      )}

      {editing && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={loading}>
            <Save className="w-4 h-4" /> Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}

function ContratTab({ demande, onUpdate, loading }: { demande: DemandeDomiciliation; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [bureau, setBureau] = useState(demande.numeroBureau?.toString() || "");
  const [visible, setVisible] = useState(demande.visibleSurSite ?? false);
  const [editing, setEditing] = useState(false);
  const [contrat, setContrat] = useState({
    referenceContratNotarie: demande.referenceContratNotarie || "",
    dateDebutContrat: demande.dateDebutContrat ? String(demande.dateDebutContrat).split("T")[0] : "",
    dateFinContrat: demande.dateFinContrat ? String(demande.dateFinContrat).split("T")[0] : "",
    montantMensuel: demande.montantMensuel?.toString() || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBureau(demande.numeroBureau?.toString() || "");
    setVisible(demande.visibleSurSite ?? false);
    setContrat({
      referenceContratNotarie: demande.referenceContratNotarie || "",
      dateDebutContrat: demande.dateDebutContrat ? String(demande.dateDebutContrat).split("T")[0] : "",
      dateFinContrat: demande.dateFinContrat ? String(demande.dateFinContrat).split("T")[0] : "",
      montantMensuel: demande.montantMensuel?.toString() || "",
    });
  }, [demande]);

  const mois = contrat.dateDebutContrat && contrat.dateFinContrat
    ? Math.max(1, Math.round((new Date(contrat.dateFinContrat).getTime() - new Date(contrat.dateDebutContrat).getTime()) / (30.44 * 24 * 60 * 60 * 1000)))
    : 6;
  const montantTotal = contrat.montantMensuel ? Number(contrat.montantMensuel) * mois : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        numeroBureau: bureau ? Number(bureau) : undefined,
        visibleSurSite: visible,
      };
      if (editing) {
        if (contrat.referenceContratNotarie) data.referenceContratNotarie = contrat.referenceContratNotarie;
        if (contrat.dateDebutContrat) data.dateDebutContrat = contrat.dateDebutContrat;
        if (contrat.dateFinContrat) data.dateFinContrat = contrat.dateFinContrat;
        if (contrat.montantMensuel) data.montantMensuel = Number(contrat.montantMensuel);
      }
      await onUpdate(data);
      setEditing(false);
    } catch { /* error already toasted */ }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader icon={FileCheck} title="Details du contrat" color="from-emerald-500 to-teal-500" />
        <Button size="sm" variant={editing ? "danger" : "outline"} onClick={() => setEditing(!editing)}>
          {editing ? <><X className="w-4 h-4" /> Annuler</> : <><Pencil className="w-4 h-4" /> Modifier</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numero de bureau</label>
          <select
            value={bureau}
            onChange={(e) => setBureau(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            <option value="">Non attribue</option>
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Bureau {n}</option>
            ))}
          </select>
        </div>
        {editing ? (
          <Input label="Reference contrat" value={contrat.referenceContratNotarie} onChange={(e) => setContrat({ ...contrat, referenceContratNotarie: e.target.value })} />
        ) : (
          <Field label="Reference contrat" value={demande.referenceContratNotarie || "-"} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {editing ? (
          <>
            <Input label="Date debut" type="date" value={contrat.dateDebutContrat} onChange={(e) => setContrat({ ...contrat, dateDebutContrat: e.target.value })} />
            <Input label="Date fin" type="date" value={contrat.dateFinContrat} onChange={(e) => setContrat({ ...contrat, dateFinContrat: e.target.value })} />
            <Input label="Montant mensuel (DA)" type="number" value={contrat.montantMensuel} onChange={(e) => setContrat({ ...contrat, montantMensuel: e.target.value })} />
          </>
        ) : (
          <>
            <Field label="Date debut" value={demande.dateDebutContrat ? formatDate(demande.dateDebutContrat) : "-"} />
            <Field label="Date fin" value={demande.dateFinContrat ? formatDate(demande.dateFinContrat) : "-"} />
            <Field label="Montant mensuel" value={demande.montantMensuel ? formatCurrency(demande.montantMensuel) : "-"} />
          </>
        )}
      </div>

      {contrat.montantMensuel && contrat.dateDebutContrat && contrat.dateFinContrat && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Montant total du contrat ({mois} mois)</p>
              <p className="text-xs text-emerald-600 mt-0.5">Paiement unique lors de la signature notariale</p>
            </div>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(montantTotal)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div>
          <p className="font-medium text-gray-900">Visible sur le site</p>
          <p className="text-sm text-gray-500">Afficher cette domiciliation dans la liste publique</p>
        </div>
        <button
          onClick={() => setVisible(!visible)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${visible ? "bg-teal-500" : "bg-gray-300"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${visible ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving || loading}>
          <Save className="w-4 h-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
}

function CourrierTab({ demande }: { demande: DemandeDomiciliation }) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nc, setNc] = useState({ type: "lettre", expediteur: "", description: "" });
  const [retireModal, setRetireModal] = useState<string | null>(null);
  const [retirePar, setRetirePar] = useState("");

  const load = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await apiClient.getUserCourrier(demande.id);
      const data = r.data as Record<string, unknown> | undefined;
      setCourriers(((data?.courriers || []) as CourrierItem[]));
    } catch { setCourriers([]); }
    finally { setLoadingList(false); }
  }, [demande.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!nc.expediteur.trim()) { toast.error("Expediteur requis"); return; }
    setSubmitting(true);
    try {
      await apiClient.createCourrier({ domiciliationId: demande.id, ...nc });
      toast.success("Courrier ajoute");
      setNc({ type: "lettre", expediteur: "", description: "" });
      setShowForm(false);
      await load();
    } catch { toast.error("Erreur lors de la creation"); }
    finally { setSubmitting(false); }
  };

  const markRetire = async () => {
    if (!retireModal) return;
    try {
      await apiClient.updateCourrier(retireModal, { action: "marquer_retire", retire_par: retirePar });
      toast.success("Courrier marque comme retire");
      setRetireModal(null);
      setRetirePar("");
      await load();
    } catch { toast.error("Erreur lors de la mise a jour"); }
  };

  const markEnvoye = async (id: string) => {
    try {
      await apiClient.updateCourrier(id, { action: "marquer_envoye" });
      toast.success("Courrier marque comme envoye");
      await load();
    } catch { toast.error("Erreur"); }
  };

  const archiver = async (id: string) => {
    try {
      await apiClient.updateCourrier(id, { action: "archiver" });
      toast.success("Courrier archive");
      await load();
    } catch { toast.error("Erreur"); }
  };

  const tc: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    lettre: { label: "Lettre", icon: Mail, color: "bg-blue-50 text-blue-600" },
    colis: { label: "Colis", icon: Package, color: "bg-teal-50 text-teal-600" },
    recommande: { label: "Recommande", icon: FileText, color: "bg-red-50 text-red-600" },
    autre: { label: "Autre", icon: Mail, color: "bg-gray-50 text-gray-600" },
  };

  const sc: Record<string, { label: string; variant: "warning" | "success" | "info" | "danger" | "default" }> = {
    recu: { label: "Recu", variant: "warning" },
    notifie: { label: "Notifie", variant: "info" },
    en_attente_instruction: { label: "Att. instruction", variant: "warning" },
    retire: { label: "Retire", variant: "success" },
    envoye: { label: "Envoye", variant: "info" },
    archive: { label: "Archive", variant: "default" },
  };

  const nonTraites = courriers.filter((c) => !["retire", "envoye", "archive"].includes(c.statut)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SectionHeader icon={Mail} title="Courrier" color="from-sky-500 to-blue-500" />
          {nonTraites > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{nonTraites}</span>}
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4" /> Fermer</> : <><Plus className="w-4 h-4" /> Ajouter</>}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-2 border-amber-200 bg-amber-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={nc.type} onChange={(e) => setNc({ ...nc, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                <option value="lettre">Lettre</option>
                <option value="colis">Colis</option>
                <option value="recommande">Recommande</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <Input label="Expediteur" value={nc.expediteur} onChange={(e) => setNc({ ...nc, expediteur: e.target.value })} required />
            <Input label="Description" value={nc.description} onChange={(e) => setNc({ ...nc, description: e.target.value })} />
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={handleCreate} loading={submitting}>
              <Plus className="w-4 h-4" /> Creer
            </Button>
          </div>
        </Card>
      )}

      {loadingList ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : courriers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucun courrier enregistre</div>
      ) : (
        <div className="space-y-2">
          {courriers.map((c) => {
            const t = tc[c.type] || tc.autre;
            const s = sc[c.statut] || sc.recu;
            const TI = t.icon;
            const dateStr = c.date_reception || c.dateReception;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}>
                  <TI className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{t.label}</p>
                    <Badge variant={s.variant} size="sm">{s.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.expediteur}{dateStr && ` - ${format(new Date(dateStr), "d MMM yyyy", { locale: fr })}`}
                  </p>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  {c.retire_par && <p className="text-xs text-emerald-600 mt-0.5">Retire par: {c.retire_par}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!["retire", "envoye", "archive"].includes(c.statut) && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setRetireModal(c.id); setRetirePar(""); }} title="Marquer retire">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => markEnvoye(c.id)} title="Marquer envoye">
                        <Mail className="w-4 h-4 text-sky-600" />
                      </Button>
                    </>
                  )}
                  {c.statut !== "archive" && (
                    <Button size="sm" variant="ghost" onClick={() => archiver(c.id)} title="Archiver">
                      <Ban className="w-4 h-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!retireModal} onClose={() => setRetireModal(null)} title="Marquer le courrier comme retire">
        <div className="space-y-4">
          <Input label="Retire par (nom de la personne)" value={retirePar} onChange={(e) => setRetirePar(e.target.value)} placeholder="Nom de la personne" />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRetireModal(null)}>Annuler</Button>
            <Button onClick={markRetire}>Confirmer le retrait</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DocumentsTab({ demande }: { demande: DemandeDomiciliation }) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState("");
  const [rejectModal, setRejectModal] = useState<DocumentRecord | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const apiSlots = demande.typeStructure === "auto_entrepreneur" ? AUTO_ENTREPRENEUR_DOCS : SOCIETE_DOCS;
  const allApiSlots = [...apiSlots, ...COMMON_DOCS];

  const wizardDocs = getWizardDocSlots(demande.situationAdministrative, demande.typeStructure);
  const allSlots = mergeDocSlots(allApiSlots, wizardDocs);

  const getDoc = (type: string) => docs.find((d) => d.document_type === type);

  const loadDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const documents = await loadDocumentsFromApi("domiciliation", demande.id);
      setDocs(documents);
    } catch { setDocs([]); }
    finally { setLoadingDocs(false); }
  }, [demande.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUploadClick = (docType: string) => { setUploadTarget(docType); fileRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Fichier trop volumineux (max 5 Mo)"); return; }
    try {
      setUploading(uploadTarget);
      const res = await apiClient.uploadDocument(file, "domiciliation", demande.id, uploadTarget);
      if (res.success) { toast.success("Document uploade"); await loadDocs(); }
      else toast.error(res.error || "Erreur d'upload");
    } catch { toast.error("Erreur d'upload"); }
    finally { setUploading(null); setUploadTarget(""); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try { await triggerDocumentDownload(doc); }
    catch { toast.error("Erreur de telechargement"); }
  };

  const handlePreview = async (doc: DocumentRecord) => {
    try {
      const url = await openDocumentPreview(doc);
      if (url) setPreviewUrl(url);
      else await handleDownload(doc);
    } catch { await handleDownload(doc); }
  };

  const handleValidate = async (doc: DocumentRecord) => {
    try {
      const res = await apiClient.updateDocumentStatus(doc.id, "valide");
      if (res.success) { toast.success("Document valide"); await loadDocs(); }
      else toast.error(res.error || "Erreur");
    } catch { toast.error("Erreur"); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      const res = await apiClient.updateDocumentStatus(rejectModal.id, "rejete", rejectComment || undefined);
      if (res.success) { toast.success("Document rejete"); setRejectModal(null); setRejectComment(""); await loadDocs(); }
      else toast.error(res.error || "Erreur");
    } catch { toast.error("Erreur"); }
  };

  const handleDelete = async (doc: DocumentRecord) => {
    try {
      const res = await apiClient.deleteDocument(doc.id);
      if (res.success) { toast.success("Document supprime"); await loadDocs(); }
      else toast.error(res.error || "Erreur");
    } catch { toast.error("Erreur"); }
  };

  const requiredSlots = allSlots.filter((s) => s.required);
  const uploadedRequired = requiredSlots.filter((s) => getDoc(s.type)).length;
  const pct = requiredSlots.length > 0 ? Math.round((uploadedRequired / requiredSlots.length) * 100) : 0;

  const stMap: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
    en_attente: { label: "En attente", variant: "warning" },
    valide: { label: "Valide", variant: "success" },
    rejete: { label: "Rejete", variant: "danger" },
  };

  if (loadingDocs) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      <div className="flex items-center justify-between">
        <SectionHeader icon={FileText} title={`Documents (${docs.length})`} color="from-teal-500 to-emerald-500" />
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>{pct}%</span>
          <span className="text-xs text-gray-500">{uploadedRequired}/{requiredSlots.length} requis</span>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {allSlots.map((slot) => {
          const doc = getDoc(slot.type);
          const isUpl = uploading === slot.type;
          const st = doc?.status ? stMap[doc.status] : null;
          return (
            <div
              key={slot.type}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                doc
                  ? doc.status === "rejete"
                    ? "bg-red-50/50 border-red-200"
                    : doc.status === "valide"
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-gray-50 border-gray-200"
                  : slot.required
                  ? "bg-amber-50/30 border-amber-200 border-dashed"
                  : "bg-gray-50/50 border-gray-200 border-dashed"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                doc
                  ? doc.status === "valide" ? "bg-emerald-100" : doc.status === "rejete" ? "bg-red-100" : "bg-teal-100"
                  : "bg-gray-100"
              }`}>
                {doc ? (
                  <File className={`w-4 h-4 ${doc.status === "valide" ? "text-emerald-600" : doc.status === "rejete" ? "text-red-600" : "text-teal-600"}`} />
                ) : (
                  <FileText className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{slot.label}</p>
                  {slot.required && !doc && <Badge variant="warning" size="sm">Requis</Badge>}
                  {st && <Badge variant={st.variant} size="sm">{st.label}</Badge>}
                </div>
                {doc && (
                  <p className="text-xs text-gray-500 truncate">
                    {doc.file_name} {doc.file_size ? `(${formatFileSize(doc.file_size)})` : ""}
                  </p>
                )}
                {doc?.status === "rejete" && doc.commentaire_rejet && (
                  <p className="text-xs text-red-600 mt-0.5">{doc.commentaire_rejet}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {doc ? (
                  <>
                    <button onClick={() => handlePreview(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-teal-600" title="Apercu"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Telecharger"><Download className="w-4 h-4" /></button>
                    {doc.status !== "valide" && <button onClick={() => handleValidate(doc)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Valider"><CheckCircle className="w-4 h-4" /></button>}
                    {doc.status !== "rejete" && <button onClick={() => { setRejectModal(doc); setRejectComment(""); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Rejeter"><XCircle className="w-4 h-4" /></button>}
                    <button onClick={() => handleUploadClick(slot.type)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Remplacer"><RefreshCw className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(doc)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </>
                ) : (
                  <button onClick={() => handleUploadClick(slot.type)} disabled={isUpl} className="text-xs bg-gray-800 text-white hover:bg-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {isUpl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {isUpl ? "Envoi..." : "Uploader"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {docs.filter((d) => !allSlots.some((s) => s.type === d.document_type)).length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Autres documents telecharges</h4>
          </div>
          {docs
            .filter((d) => !allSlots.some((s) => s.type === d.document_type))
            .map((doc) => {
              const st = doc.status ? stMap[doc.status] : null;
              return (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 border-gray-200">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-100">
                    <File className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{doc.document_type}</p>
                      {st && <Badge variant={st.variant} size="sm">{st.label}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{doc.file_name} {doc.file_size ? `(${formatFileSize(doc.file_size)})` : ""}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handlePreview(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-teal-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><Download className="w-4 h-4" /></button>
                    {doc.status !== "valide" && <button onClick={() => handleValidate(doc)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"><CheckCircle className="w-4 h-4" /></button>}
                    <button onClick={() => handleDelete(doc)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
        </>
      )}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Rejeter le document">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">Rejeter le document : <strong>{rejectModal?.file_name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif du rejet</label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              placeholder="Ex: Document illisible, veuillez renvoyer une copie plus nette..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleReject}>Rejeter</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!previewUrl} onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} title="Apercu du document" size="lg">
        {previewUrl && <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg border border-gray-200" title="Apercu" />}
      </Modal>
    </div>
  );
}

function getWizardDocSlots(
  situation: string,
  typeStructure: string
): { type: string; label: string; required: boolean }[] {
  if (situation === "en_cours_creation") {
    if (typeStructure === "societe") {
      return REQUIRED_DOCS_NEW_SOCIETE.map((d) => ({ type: d.id, label: d.name, required: d.required }));
    }
    return REQUIRED_DOCS_NEW_AUTO_ENTREPRENEUR.map((d) => ({ type: d.id, label: d.name, required: d.required }));
  }
  if (typeStructure === "societe") {
    return REQUIRED_DOCS_EXISTING_SOCIETE.map((d) => ({ type: d.id, label: d.name, required: d.required }));
  }
  return REQUIRED_DOCS_EXISTING_AUTO_ENTREPRENEUR.map((d) => ({ type: d.id, label: d.name, required: d.required }));
}

function mergeDocSlots(
  apiSlots: { type: string; label: string; required: boolean }[],
  wizardSlots: { type: string; label: string; required: boolean }[]
): { type: string; label: string; required: boolean }[] {
  const merged = [...apiSlots];
  for (const ws of wizardSlots) {
    if (!merged.some((s) => s.type === ws.type)) {
      merged.push(ws);
    }
  }
  return merged;
}

function NotesTab({ demande, onUpdate, loading }: { demande: DemandeDomiciliation; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [notes, setNotes] = useState(demande.commentaireAdmin || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setNotes(demande.commentaireAdmin || ""); }, [demande.commentaireAdmin]);

  const handleSave = async () => {
    setSaving(true);
    try { await onUpdate({ commentaireAdmin: notes }); }
    catch { /* error already toasted */ }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={StickyNote} title="Notes administratives" color="from-amber-500 to-yellow-500" />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="Ajoutez vos notes internes ici..."
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y"
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving || loading}>
          <Save className="w-4 h-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
}

function ActionsTab({ demande, onAction, loading }: { demande: DemandeDomiciliation; onAction: (action: string, data?: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [sd, setSd] = useState({
    numeroBureau: demande.numeroBureau || 1,
    referenceContratNotarie: demande.referenceContratNotarie || "",
    dateDebutContrat: demande.dateDebutContrat ? String(demande.dateDebutContrat).split("T")[0] : new Date().toISOString().split("T")[0],
    dateFinContrat: demande.dateFinContrat ? String(demande.dateFinContrat).split("T")[0] : new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    montantMensuel: demande.montantMensuel || 12000,
  });
  const [occupiedBureaux, setOccupiedBureaux] = useState<number[]>([]);

  useEffect(() => {
    apiClient.getDomiciliations().then((res) => {
      if (res.success && res.data) {
        const all = (Array.isArray(res.data) ? res.data : (res.data as Record<string, unknown>).data as unknown[] || []) as Record<string, unknown>[];
        const occupied = all
          .filter((d) =>
            ["active", "domiciliation_creee", "en_attente_complements", "en_attente_signature"].includes(String(d.statut || "")) &&
            d.numero_bureau &&
            String(d.id) !== demande.id
          )
          .map((d) => Number(d.numero_bureau));
        setOccupiedBureaux(occupied);
      }
    }).catch(() => {});
  }, [demande.id]);

  const mois = Math.max(1, Math.round((new Date(sd.dateFinContrat).getTime() - new Date(sd.dateDebutContrat).getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
  const montantTotal = sd.montantMensuel * mois;

  const defs: { key: string; label: string; icon: React.ElementType; variant: string; statuts: string[]; destructive?: boolean }[] = [
    { key: "valider", label: "Valider le dossier", icon: CheckCircle, variant: "success", statuts: ["dossier_preparatoire"] },
    { key: "rejeter", label: "Refuser la demande", icon: XCircle, variant: "danger", statuts: ["dossier_preparatoire", "en_attente_signature"], destructive: true },
    { key: "signer", label: "Enregistrer signature notaire", icon: Scale, variant: "primary", statuts: ["en_attente_signature"] },
    { key: "completer", label: "Completer et activer", icon: FileCheck, variant: "success", statuts: ["domiciliation_creee", "en_attente_complements"] },
    { key: "activer", label: "Activer", icon: PlayCircle, variant: "success", statuts: ["domiciliation_creee", "en_attente_complements"] },
    { key: "renouveler", label: "Renouveler le contrat", icon: RefreshCw, variant: "primary", statuts: ["expiree", "active"] },
    { key: "resilier", label: "Resilier la domiciliation", icon: Ban, variant: "danger", statuts: ["active"], destructive: true },
  ];
  const available = defs.filter((a) => a.statuts.includes(demande.statut));

  const handleSubmit = async (key: string) => {
    if (key === "rejeter" && !motif.trim()) { toast.error("Veuillez preciser le motif du refus"); return; }
    if (key === "resilier" && !motif.trim()) { toast.error("Veuillez preciser le motif de la resiliation"); return; }
    if (key === "signer" && !sd.referenceContratNotarie.trim()) { toast.error("Reference du contrat requise"); return; }
    if (key === "signer" && occupiedBureaux.includes(sd.numeroBureau)) { toast.error(`Le bureau ${sd.numeroBureau} est deja attribue`); return; }
    const data: Record<string, unknown> = {};
    if (key === "rejeter" || key === "resilier") data.motif = motif;
    if (key === "signer") Object.assign(data, sd);
    if (key === "renouveler") Object.assign(data, sd);
    await onAction(key, data);
    setActiveAction(null);
    setConfirmAction(null);
    setMotif("");
  };

  if (available.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Aucune action disponible pour le statut actuel</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={Scale} title="Actions disponibles" color="from-sky-500 to-blue-500" />
      <div className="space-y-3">
        {available.map((a) => {
          const Icon = a.icon;
          const isAct = activeAction === a.key;
          return (
            <div key={a.key} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveAction(isAct ? null : a.key)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  a.variant === "danger" ? "bg-red-100 text-red-600" :
                  a.variant === "success" ? "bg-emerald-100 text-emerald-600" :
                  "bg-sky-100 text-sky-600"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">{a.label}</span>
                {a.destructive && <Badge variant="danger" size="sm">Irreversible</Badge>}
              </button>
              {isAct && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {(a.key === "signer" || a.key === "renouveler") && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero de bureau (1-36)</label>
                        <select
                          value={sd.numeroBureau}
                          onChange={(e) => setSd({ ...sd, numeroBureau: parseInt(e.target.value) })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                        >
                          {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
                            const isOccupied = occupiedBureaux.includes(n);
                            return (
                              <option key={n} value={n} className={isOccupied ? "text-red-500 bg-red-50" : ""}>
                                Bureau {n}{isOccupied ? " (occupe)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {occupiedBureaux.includes(sd.numeroBureau) && (
                          <p className="text-xs text-red-600 mt-1 font-medium">Ce bureau est deja attribue</p>
                        )}
                      </div>
                      <Input label="Reference contrat notarie" value={sd.referenceContratNotarie} onChange={(e) => setSd({ ...sd, referenceContratNotarie: e.target.value })} required />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="Date debut" type="date" value={sd.dateDebutContrat} onChange={(e) => setSd({ ...sd, dateDebutContrat: e.target.value })} />
                        <Input label="Date fin" type="date" value={sd.dateFinContrat} onChange={(e) => setSd({ ...sd, dateFinContrat: e.target.value })} />
                      </div>
                      <Input label="Montant mensuel (DA)" type="number" value={sd.montantMensuel.toString()} onChange={(e) => setSd({ ...sd, montantMensuel: parseInt(e.target.value) || 0 })} />
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <p className="text-sm font-medium text-emerald-800">Total: {formatCurrency(montantTotal)} ({mois} mois)</p>
                      </div>
                    </div>
                  )}
                  {(a.key === "rejeter" || a.key === "resilier") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motif <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        rows={3}
                        placeholder={a.key === "rejeter" ? "Raison du refus..." : "Raison de la resiliation..."}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  )}
                  {a.destructive ? (
                    confirmAction === a.key ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)} className="flex-1">Annuler</Button>
                        <Button variant="danger" size="sm" onClick={() => handleSubmit(a.key)} loading={loading} className="flex-1">Confirmer</Button>
                      </div>
                    ) : (
                      <Button variant="danger" size="sm" onClick={() => setConfirmAction(a.key)} className="w-full">{a.label}</Button>
                    )
                  ) : (
                    <Button variant={a.variant as "primary" | "success"} size="sm" onClick={() => handleSubmit(a.key)} loading={loading} className="w-full">{a.label}</Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
