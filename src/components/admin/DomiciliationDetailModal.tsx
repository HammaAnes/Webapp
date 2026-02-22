import React, { useState, useEffect, useCallback } from "react";
import { Building, User, FileText, Mail, Package, CheckCircle, XCircle, Scale, Ban, PlayCircle, AlertCircle, Save, Plus, Loader2, StickyNote, Briefcase, Pencil, X, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { apiClient } from "../../lib/api-client";
import { formatDate, formatCurrency } from "../../utils/formatters";

interface DomiciliationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: any;
  onAction: (action: string, data?: Record<string, unknown>) => Promise<void>;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

type TabId = "informations" | "contrat" | "courrier" | "documents" | "notes" | "actions";
interface CourrierItem { id: string; type: string; expediteur: string; description: string; statut: string; dateReception: string; dateRetrait?: string; }
interface DocumentItem { id: string; type: string; nom: string; url?: string; statut: "en_attente" | "valide" | "rejete"; dateUpload: string; }

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

function InformationsTab({ demande, onUpdate, loading }: { demande: any; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [editing, setEditing] = useState(false);
  const rep = demande.representantLegal || {};
  const initForm = useCallback(() => ({
    raisonSociale: demande.raisonSociale || "", formeJuridique: demande.formeJuridique || "",
    nif: demande.nif || "", nis: demande.nis || "", registreCommerce: demande.registreCommerce || "",
    articleImposition: demande.articleImposition || "", codeNae: demande.codeNae || "",
    activiteExercee: demande.activiteExercee || "", numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur || "",
    repNom: rep.nom || "", repPrenom: rep.prenom || "", repTel: rep.telephone || "",
    repEmail: rep.email || "", repVille: rep.ville || "", repAdresse: rep.adresseResidence || "",
  }), [demande]);
  const [form, setForm] = useState(initForm);
  useEffect(() => { setForm(initForm()); }, [initForm]);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const handleSave = async () => {
    try {
      await onUpdate({
        raisonSociale: form.raisonSociale, formeJuridique: form.formeJuridique, nif: form.nif,
        nis: form.nis, registreCommerce: form.registreCommerce, articleImposition: form.articleImposition,
        codeNae: form.codeNae, activiteExercee: form.activiteExercee, numeroAutoEntrepreneur: form.numeroAutoEntrepreneur,
        representantLegal: { nom: form.repNom, prenom: form.repPrenom, telephone: form.repTel, email: form.repEmail, ville: form.repVille, adresseResidence: form.repAdresse },
      });
      setEditing(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Situation</p>
          <p className="font-semibold text-amber-900 text-sm mt-1">{demande.situationAdministrative === "en_cours_creation" ? "En cours de creation" : "Deja creee"}</p>
        </div>
        <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
          <p className="text-xs text-sky-700 uppercase tracking-wide font-semibold">Type</p>
          <p className="font-semibold text-sky-900 text-sm mt-1">{isAE ? "Auto-entrepreneur" : "Societe"}</p>
        </div>
      </div>
      <div>
        <SectionHeader icon={Briefcase} title="Entreprise" color="from-amber-500 to-orange-500" />
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Raison sociale" value={form.raisonSociale} onChange={(e) => set("raisonSociale", e.target.value)} />
            <Input label="Forme juridique" value={form.formeJuridique} onChange={(e) => set("formeJuridique", e.target.value)} />
            <Input label="NIF" value={form.nif} onChange={(e) => set("nif", e.target.value)} maxLength={20} />
            <Input label="NIS" value={form.nis} onChange={(e) => set("nis", e.target.value)} maxLength={15} />
            <Input label="Registre Commerce" value={form.registreCommerce} onChange={(e) => set("registreCommerce", e.target.value)} />
            <Input label="Article Imposition" value={form.articleImposition} onChange={(e) => set("articleImposition", e.target.value)} />
            {isAE && <><Input label="Activite exercee" value={form.activiteExercee} onChange={(e) => set("activiteExercee", e.target.value)} /><Input label="N. Auto-entrepreneur" value={form.numeroAutoEntrepreneur} onChange={(e) => set("numeroAutoEntrepreneur", e.target.value)} /></>}
            {isSociete && <Input label="Code NAE" value={form.codeNae} onChange={(e) => set("codeNae", e.target.value)} />}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Raison sociale" value={demande.raisonSociale} />
            <Field label="Forme juridique" value={demande.formeJuridique} />
            {isSociete && <><Field label="NIF" value={demande.nif} /><Field label="NIS" value={demande.nis} /><Field label="Registre Commerce" value={demande.registreCommerce} /><Field label="Article Imposition" value={demande.articleImposition} /><Field label="Code NAE" value={demande.codeNae} /></>}
            {isAE && <><Field label="Activite exercee" value={demande.activiteExercee} /><Field label="N. Auto-entrepreneur" value={demande.numeroAutoEntrepreneur} /></>}
          </div>
        )}
      </div>
      <div>
        <SectionHeader icon={User} title="Representant Legal" color="from-sky-500 to-cyan-500" />
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prenom" value={form.repPrenom} onChange={(e) => set("repPrenom", e.target.value)} />
            <Input label="Nom" value={form.repNom} onChange={(e) => set("repNom", e.target.value)} />
            <Input label="Telephone" value={form.repTel} onChange={(e) => set("repTel", e.target.value)} />
            <Input label="Email" value={form.repEmail} onChange={(e) => set("repEmail", e.target.value)} />
            <Input label="Ville" value={form.repVille} onChange={(e) => set("repVille", e.target.value)} />
            <div className="col-span-2"><Input label="Adresse" value={form.repAdresse} onChange={(e) => set("repAdresse", e.target.value)} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom complet" value={`${rep.prenom || ""} ${rep.nom || ""}`} />
            <Field label="Telephone" value={rep.telephone} />
            <Field label="Email" value={rep.email} />
            <Field label="Ville" value={rep.ville} />
            {rep.adresseResidence && <div className="col-span-2"><Field label="Adresse" value={rep.adresseResidence} /></div>}
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
      {editing && <div className="flex justify-end pt-2"><Button onClick={handleSave} loading={loading}><Save className="w-4 h-4" /> Enregistrer</Button></div>}
    </div>
  );
}

function ContratTab({ demande, onUpdate, loading }: { demande: any; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [bureau, setBureau] = useState(demande.numeroBureau || "");
  const [visible, setVisible] = useState(demande.visibleSurSite ?? false);
  const [editing, setEditing] = useState(false);
  const [contrat, setContrat] = useState({
    referenceContratNotarie: demande.referenceContratNotarie || "",
    dateDebutContrat: demande.dateDebutContrat ? String(demande.dateDebutContrat).split("T")[0] : "",
    dateFinContrat: demande.dateFinContrat ? String(demande.dateFinContrat).split("T")[0] : "",
    montantMensuel: demande.montantMensuel || "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setBureau(demande.numeroBureau || "");
    setVisible(demande.visibleSurSite ?? false);
    setContrat({
      referenceContratNotarie: demande.referenceContratNotarie || "",
      dateDebutContrat: demande.dateDebutContrat ? String(demande.dateDebutContrat).split("T")[0] : "",
      dateFinContrat: demande.dateFinContrat ? String(demande.dateFinContrat).split("T")[0] : "",
      montantMensuel: demande.montantMensuel || "",
    });
  }, [demande]);
  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = { numeroBureau: bureau ? Number(bureau) : undefined, visibleSurSite: visible };
      if (editing) {
        if (contrat.referenceContratNotarie) data.referenceContratNotarie = contrat.referenceContratNotarie;
        if (contrat.dateDebutContrat) data.dateDebutContrat = contrat.dateDebutContrat;
        if (contrat.dateFinContrat) data.dateFinContrat = contrat.dateFinContrat;
        if (contrat.montantMensuel) data.montantMensuel = Number(contrat.montantMensuel);
      }
      await onUpdate(data);
      setEditing(false);
    } catch { toast.error("Erreur lors de la mise a jour"); }
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numero de bureau</label>
          <select value={bureau} onChange={(e) => setBureau(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
            <option value="">Non attribue</option>
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Bureau {n}</option>)}
          </select>
        </div>
        {editing ? (
          <Input label="Reference contrat" value={contrat.referenceContratNotarie} onChange={(e) => setContrat({ ...contrat, referenceContratNotarie: e.target.value })} />
        ) : (
          <Field label="Reference contrat" value={demande.referenceContratNotarie || "-"} />
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {editing ? (
          <>
            <Input label="Date debut" type="date" value={contrat.dateDebutContrat} onChange={(e) => setContrat({ ...contrat, dateDebutContrat: e.target.value })} />
            <Input label="Date fin" type="date" value={contrat.dateFinContrat} onChange={(e) => setContrat({ ...contrat, dateFinContrat: e.target.value })} />
            <Input label="Montant mensuel (DA)" type="number" value={String(contrat.montantMensuel)} onChange={(e) => setContrat({ ...contrat, montantMensuel: e.target.value })} />
          </>
        ) : (
          <>
            <Field label="Date debut" value={demande.dateDebutContrat ? formatDate(demande.dateDebutContrat) : "-"} />
            <Field label="Date fin" value={demande.dateFinContrat ? formatDate(demande.dateFinContrat) : "-"} />
            <Field label="Montant mensuel" value={demande.montantMensuel ? formatCurrency(demande.montantMensuel) : "-"} />
          </>
        )}
      </div>
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div>
          <p className="font-medium text-gray-900">Visible sur le site</p>
          <p className="text-sm text-gray-500">Afficher cette domiciliation dans la liste publique</p>
        </div>
        <button onClick={() => setVisible(!visible)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${visible ? "bg-teal-500" : "bg-gray-300"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${visible ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
      <div className="flex justify-end"><Button onClick={handleSave} loading={saving || loading}><Save className="w-4 h-4" /> Enregistrer</Button></div>
    </div>
  );
}

function CourrierTab({ demande }: { demande: any }) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nc, setNc] = useState({ type: "lettre", expediteur: "", description: "" });
  const load = useCallback(async () => {
    setLoadingList(true);
    try { const r = await apiClient.getUserCourrier(demande.id); setCourriers(((r.data as any)?.courriers || []) as CourrierItem[]); }
    catch { setCourriers([]); }
    finally { setLoadingList(false); }
  }, [demande.id]);
  useEffect(() => { load(); }, [load]);
  const handleCreate = async () => {
    if (!nc.expediteur.trim()) { toast.error("Expediteur requis"); return; }
    setSubmitting(true);
    try { await apiClient.createCourrier({ domiciliationId: demande.id, ...nc }); toast.success("Courrier ajoute"); setNc({ type: "lettre", expediteur: "", description: "" }); setShowForm(false); await load(); }
    catch { toast.error("Erreur lors de la creation"); }
    finally { setSubmitting(false); }
  };
  const markRetire = async (id: string) => {
    try { await apiClient.updateCourrier(id, { action: "marquer_retire" }); toast.success("Statut mis a jour"); await load(); }
    catch { toast.error("Erreur lors de la mise a jour"); }
  };
  const tc: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    lettre: { label: "Lettre", icon: Mail, color: "bg-blue-50 text-blue-600" },
    colis: { label: "Colis", icon: Package, color: "bg-teal-50 text-teal-600" },
    recommande: { label: "Recommande", icon: FileText, color: "bg-red-50 text-red-600" },
    autre: { label: "Autre", icon: Mail, color: "bg-gray-50 text-gray-600" },
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader icon={Mail} title={`Courrier (${courriers.length})`} color="from-sky-500 to-blue-500" />
        <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? <><X className="w-4 h-4" /> Fermer</> : <><Plus className="w-4 h-4" /> Ajouter</>}</Button>
      </div>
      {showForm && (
        <Card className="p-4 border-2 border-amber-200 bg-amber-50/30">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={nc.type} onChange={(e) => setNc({ ...nc, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500">
                <option value="lettre">Lettre</option><option value="colis">Colis</option><option value="recommande">Recommande</option><option value="autre">Autre</option>
              </select>
            </div>
            <Input label="Expediteur" value={nc.expediteur} onChange={(e) => setNc({ ...nc, expediteur: e.target.value })} required />
            <Input label="Description" value={nc.description} onChange={(e) => setNc({ ...nc, description: e.target.value })} />
          </div>
          <div className="flex justify-end mt-3"><Button size="sm" onClick={handleCreate} loading={submitting}><Plus className="w-4 h-4" /> Creer</Button></div>
        </Card>
      )}
      {loadingList ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div> : courriers.length === 0 ? <div className="text-center py-8 text-gray-500">Aucun courrier enregistre</div> : (
        <div className="space-y-2">
          {courriers.map((c) => { const t = tc[c.type] || tc.autre; const TI = t.icon; return (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}><TI className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="font-medium text-gray-900 text-sm">{t.label}</p><Badge variant={c.statut === "retire" ? "success" : c.statut === "notifie" ? "info" : "warning"} size="sm">{c.statut}</Badge></div>
                <p className="text-xs text-gray-500">{c.expediteur}{c.dateReception && ` - ${format(new Date(c.dateReception), "d MMM yyyy", { locale: fr })}`}</p>
              </div>
              {c.statut !== "retire" && <Button size="sm" variant="ghost" onClick={() => markRetire(c.id)}><CheckCircle className="w-4 h-4" /></Button>}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ demande }: { demande: any }) {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  useEffect(() => { (async () => {
    setLoadingDocs(true);
    try { const r = await apiClient.getDocuments("domiciliation", demande.id); setDocs(((r.data as any)?.documents || []) as DocumentItem[]); }
    catch { setDocs([]); }
    finally { setLoadingDocs(false); }
  })(); }, [demande.id]);
  const changeStatus = async (id: string, s: string) => {
    try { await apiClient.put(`/documents/update.php?id=${id}`, { statut: s }); setDocs((p) => p.map((d) => d.id === id ? { ...d, statut: s as DocumentItem["statut"] } : d)); toast.success("Statut du document mis a jour"); }
    catch { toast.error("Erreur lors de la mise a jour"); }
  };
  const sc: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = { en_attente: { label: "En attente", variant: "warning" }, valide: { label: "Valide", variant: "success" }, rejete: { label: "Rejete", variant: "danger" } };
  if (loadingDocs) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  return (
    <div className="space-y-4">
      <SectionHeader icon={FileText} title={`Documents (${docs.length})`} color="from-teal-500 to-emerald-500" />
      {docs.length === 0 ? <div className="text-center py-8 text-gray-500">Aucun document televerse</div> : (
        <div className="space-y-2">
          {docs.map((d) => { const s = sc[d.statut] || sc.en_attente; return (
            <div key={d.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-teal-700" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{d.nom || d.type}</p>
                <p className="text-xs text-gray-500">{d.dateUpload ? format(new Date(d.dateUpload), "d MMM yyyy", { locale: fr }) : ""}</p>
              </div>
              <Badge variant={s.variant} size="sm">{s.label}</Badge>
              <select value={d.statut} onChange={(e) => changeStatus(d.id, e.target.value)} className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white">
                <option value="en_attente">En attente</option><option value="valide">Valide</option><option value="rejete">Rejete</option>
              </select>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}

function NotesTab({ demande, onUpdate, loading }: { demande: any; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [notes, setNotes] = useState(demande.commentaireAdmin || "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setNotes(demande.commentaireAdmin || ""); }, [demande.commentaireAdmin]);
  const handleSave = async () => {
    setSaving(true);
    try { await onUpdate({ commentaireAdmin: notes }); }
    catch { toast.error("Erreur lors de l'enregistrement"); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <SectionHeader icon={StickyNote} title="Notes administratives" color="from-amber-500 to-yellow-500" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Ajoutez vos notes internes ici..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y" />
      <div className="flex justify-end"><Button onClick={handleSave} loading={saving || loading}><Save className="w-4 h-4" /> Enregistrer</Button></div>
    </div>
  );
}

function ActionsTab({ demande, onAction, loading }: { demande: any; onAction: (action: string, data?: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [sd, setSd] = useState({ numeroBureau: 1, referenceContratNotarie: "", dateDebutContrat: new Date().toISOString().split("T")[0], dateFinContrat: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], montantMensuel: 12000 });
  const [occupiedBureaux, setOccupiedBureaux] = useState<number[]>([]);
  useEffect(() => {
    apiClient.getDomiciliations().then(res => {
      if (res.success && res.data) {
        const all = (Array.isArray(res.data) ? res.data : (res.data as Record<string, unknown>).data as unknown[] || []) as Record<string, unknown>[];
        const occupied = all
          .filter(d => ["active", "domiciliation_creee", "en_attente_complements", "en_attente_signature"].includes(String(d.statut || "")) && d.numero_bureau && String(d.id) !== demande.id)
          .map(d => Number(d.numero_bureau));
        setOccupiedBureaux(occupied);
      }
    }).catch(() => {});
  }, [demande.id]);
  const defs: { key: string; label: string; icon: React.ElementType; variant: string; statuts: string[]; destructive?: boolean }[] = [
    { key: "valider", label: "Valider le dossier", icon: CheckCircle, variant: "success", statuts: ["dossier_preparatoire"] },
    { key: "rejeter", label: "Refuser la demande", icon: XCircle, variant: "danger", statuts: ["dossier_preparatoire", "en_attente_signature"], destructive: true },
    { key: "signer", label: "Enregistrer signature notaire", icon: Scale, variant: "primary", statuts: ["en_attente_signature"] },
    { key: "completer", label: "Completer et activer", icon: FileCheck, variant: "success", statuts: ["domiciliation_creee", "en_attente_complements"] },
    { key: "activer", label: "Activer", icon: PlayCircle, variant: "success", statuts: ["domiciliation_creee", "en_attente_complements"] },
    { key: "resilier", label: "Resilier la domiciliation", icon: Ban, variant: "danger", statuts: ["active"], destructive: true },
  ];
  const available = defs.filter((a) => a.statuts.includes(demande.statut));
  const handleSubmit = async (key: string) => {
    if (key === "rejeter" && !motif.trim()) { toast.error("Veuillez preciser le motif du refus"); return; }
    if (key === "resilier" && !motif.trim()) { toast.error("Veuillez preciser le motif de la resiliation"); return; }
    if (key === "signer" && !sd.referenceContratNotarie.trim()) { toast.error("Reference du contrat requise"); return; }
    if (key === "signer" && occupiedBureaux.includes(sd.numeroBureau)) { toast.error(`Le bureau ${sd.numeroBureau} est deja attribue a une autre domiciliation active`); return; }
    const data: Record<string, unknown> = {};
    if (key === "rejeter" || key === "resilier") data.motif = motif;
    if (key === "signer") Object.assign(data, sd);
    await onAction(key, data);
    setActiveAction(null); setConfirmAction(null); setMotif("");
  };
  if (available.length === 0) return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-gray-400" /></div>
      <p className="text-gray-500 font-medium">Aucune action disponible pour le statut actuel</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <SectionHeader icon={Scale} title="Actions disponibles" color="from-sky-500 to-indigo-500" />
      <div className="space-y-3">
        {available.map((a) => { const Icon = a.icon; const isAct = activeAction === a.key; return (
          <div key={a.key} className="border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setActiveAction(isAct ? null : a.key)} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.variant === "danger" ? "bg-red-100 text-red-600" : a.variant === "success" ? "bg-emerald-100 text-emerald-600" : "bg-sky-100 text-sky-600"}`}><Icon className="w-5 h-5" /></div>
              <span className="font-medium text-gray-900">{a.label}</span>
              {a.destructive && <Badge variant="danger" size="sm">Irreversible</Badge>}
            </button>
            {isAct && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {a.key === "signer" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numero de bureau (1-36)</label>
                      <select value={sd.numeroBureau} onChange={(e) => setSd({ ...sd, numeroBureau: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg">
                        {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
                          const isOccupied = occupiedBureaux.includes(n);
                          return <option key={n} value={n} className={isOccupied ? "text-red-500 bg-red-50" : ""}>Bureau {n}{isOccupied ? " (occupe)" : ""}</option>;
                        })}
                      </select>
                      {occupiedBureaux.includes(sd.numeroBureau) && (
                        <p className="text-xs text-red-600 mt-1 font-medium">Ce bureau est deja attribue a une autre domiciliation active</p>
                      )}
                    </div>
                    <Input label="Reference contrat notarie" value={sd.referenceContratNotarie} onChange={(e) => setSd({ ...sd, referenceContratNotarie: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Date debut" type="date" value={sd.dateDebutContrat} onChange={(e) => setSd({ ...sd, dateDebutContrat: e.target.value })} />
                      <Input label="Date fin" type="date" value={sd.dateFinContrat} onChange={(e) => setSd({ ...sd, dateFinContrat: e.target.value })} />
                    </div>
                    <Input label="Montant mensuel (DA)" type="number" value={sd.montantMensuel.toString()} onChange={(e) => setSd({ ...sd, montantMensuel: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
                {(a.key === "rejeter" || a.key === "resilier") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif <span className="text-red-500">*</span></label>
                    <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3} placeholder={a.key === "rejeter" ? "Raison du refus..." : "Raison de la resiliation..."} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
                  </div>
                )}
                {a.destructive ? (confirmAction === a.key ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)} className="flex-1">Annuler</Button>
                    <Button variant="danger" size="sm" onClick={() => handleSubmit(a.key)} loading={loading} className="flex-1">Confirmer</Button>
                  </div>
                ) : <Button variant="danger" size="sm" onClick={() => setConfirmAction(a.key)} className="w-full">{a.label}</Button>
                ) : <Button variant={a.variant as "primary" | "success"} size="sm" onClick={() => handleSubmit(a.key)} loading={loading} className="w-full">{a.label}</Button>}
              </div>
            )}
          </div>
        ); })}
      </div>
    </div>
  );
}

export default function DomiciliationDetailModal({ isOpen, onClose, demande, onAction, onUpdate, loading }: DomiciliationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("informations");
  useEffect(() => { if (isOpen) setActiveTab("informations"); }, [isOpen]);
  if (!demande) return null;
  const badge = STATUS_BADGES[demande.statut] || STATUS_BADGES.dossier_preparatoire;
  const displayName = demande.raisonSociale || `${demande.representantLegal?.prenom || ""} ${demande.representantLegal?.nom || ""}`.trim() || "Non renseigne";
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" noPadding>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Building className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
              {demande.numeroBureau && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">N{demande.numeroBureau}</span>}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
      </div>
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-6" role="tablist">
          {TABS.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
            <button key={tab.id} role="tab" aria-selected={isActive} onClick={() => setActiveTab(tab.id)} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${isActive ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          ); })}
        </nav>
      </div>
      <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
        {activeTab === "informations" && <InformationsTab demande={demande} onUpdate={onUpdate} loading={loading} />}
        {activeTab === "contrat" && <ContratTab demande={demande} onUpdate={onUpdate} loading={loading} />}
        {activeTab === "courrier" && <CourrierTab demande={demande} />}
        {activeTab === "documents" && <DocumentsTab demande={demande} />}
        {activeTab === "notes" && <NotesTab demande={demande} onUpdate={onUpdate} loading={loading} />}
        {activeTab === "actions" && <ActionsTab demande={demande} onAction={onAction} loading={loading} />}
      </div>
    </Modal>
  );
}
