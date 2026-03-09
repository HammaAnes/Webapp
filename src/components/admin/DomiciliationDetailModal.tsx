import React, { useState, useEffect, useCallback } from "react";
import {
  Building, User, FileText, Scale, Hash, Phone, Mail, MapPin,
  Calendar, Save, Pencil, X, CheckCircle, XCircle, AlertTriangle,
  Send, Package, Loader2, StickyNote, Zap, Ban,
  Plus, Banknote,
} from "lucide-react";
import Modal from "../ui/Modal";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Input from "../ui/Input";
import toast from "react-hot-toast";
import { apiClient } from "../../lib/api-client";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { LEGAL_FORM_OPTIONS_SHORT } from "../domiciliation/constants";
import type { DemandeDomiciliation } from "../../types";

interface DomiciliationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: DemandeDomiciliation | null;
  onAction: (action: string, data?: Record<string, unknown>) => Promise<void>;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

type TabKey = "informations" | "contrat" | "courrier" | "documents" | "notes" | "actions";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "informations", label: "Informations", icon: Building },
  { key: "contrat", label: "Contrat", icon: Scale },
  { key: "courrier", label: "Courrier", icon: Mail },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "actions", label: "Actions", icon: Zap },
];

const DomiciliationDetailModal: React.FC<DomiciliationDetailModalProps> = ({
  isOpen,
  onClose,
  demande,
  onAction,
  onUpdate,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("informations");

  useEffect(() => {
    if (isOpen) setActiveTab("informations");
  }, [isOpen]);

  if (!demande) return null;

  const getDisplayName = () =>
    demande.raisonSociale || `${demande.representantLegal?.prenom || ""} ${demande.representantLegal?.nom || ""}`.trim() || "Non renseigne";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getDisplayName()}
      subtitle={`Bureau ${demande.numeroBureau || "-"} | ${demande.typeStructure === "auto_entrepreneur" ? "Auto-entrepreneur" : (demande.formeJuridique || "Societe")}`}
      size="xl"
      noPadding
    >
      <div className="flex flex-col" style={{ maxHeight: "75vh" }}>
        <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto flex-shrink-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === key
                  ? "border-amber-500 text-amber-700 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "informations" && <InformationsTab demande={demande} onUpdate={onUpdate} loading={loading} />}
          {activeTab === "contrat" && <ContratTab demande={demande} onUpdate={onUpdate} loading={loading} />}
          {activeTab === "courrier" && <CourrierTab demande={demande} />}
          {activeTab === "documents" && <DocumentsTab demande={demande} />}
          {activeTab === "notes" && <NotesTab demande={demande} onUpdate={onUpdate} loading={loading} />}
          {activeTab === "actions" && <ActionsTab demande={demande} onAction={onAction} loading={loading} />}
        </div>
      </div>
    </Modal>
  );
};

function Field({ label, value, icon }: { label: string; value?: string | number | null; icon?: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="font-semibold text-gray-900 text-sm">{value || "Non renseigne"}</p>
    </div>
  );
}

function InformationsTab({ demande, onUpdate, loading }: { demande: DemandeDomiciliation; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    raisonSociale: demande.raisonSociale || "",
    formeJuridique: demande.formeJuridique || "",
    nif: demande.nif || "",
    nis: demande.nis || "",
    registreCommerce: demande.registreCommerce || "",
    articleImposition: demande.articleImposition || "",
    capital: demande.capital?.toString() || "",
    adresseSiegeSocial: demande.adresseSiegeSocial || "",
    domaineActivite: demande.domaineActivite || "",
    activiteExercee: demande.activiteExercee || "",
    numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur || "",
    codeNae: demande.codeNae || "",
  });

  useEffect(() => {
    setForm({
      raisonSociale: demande.raisonSociale || "",
      formeJuridique: demande.formeJuridique || "",
      nif: demande.nif || "",
      nis: demande.nis || "",
      registreCommerce: demande.registreCommerce || "",
      articleImposition: demande.articleImposition || "",
      capital: demande.capital?.toString() || "",
      adresseSiegeSocial: demande.adresseSiegeSocial || "",
      domaineActivite: demande.domaineActivite || "",
      activiteExercee: demande.activiteExercee || "",
      numeroAutoEntrepreneur: demande.numeroAutoEntrepreneur || "",
      codeNae: demande.codeNae || "",
    });
    setEditing(false);
  }, [demande]);

  const handleSave = async () => {
    try {
      await onUpdate(form);
      setEditing(false);
    } catch { /* handled upstream */ }
  };

  const isSociete = demande.typeStructure === "societe";
  const rep = demande.representantLegal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={demande.situationAdministrative === "en_cours_creation" ? "warning" : "info"}>
            {demande.situationAdministrative === "en_cours_creation" ? "En cours de creation" : "Deja creee"}
          </Badge>
          <Badge variant={isSociete ? "default" : "info"}>
            {isSociete ? "Societe" : "Auto-entrepreneur"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          {editing ? <><X className="w-4 h-4 mr-1" />Annuler</> : <><Pencil className="w-4 h-4 mr-1" />Modifier</>}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Raison Sociale" value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forme Juridique</label>
              <select
                value={form.formeJuridique}
                onChange={(e) => setForm({ ...form, formeJuridique: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
              >
                <option value="">Selectionner</option>
                {LEGAL_FORM_OPTIONS_SHORT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                <option value="Auto-entrepreneur">Auto-entrepreneur</option>
              </select>
            </div>
          </div>
          {isSociete ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="NIF" value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} />
                <Input label="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Registre Commerce" value={form.registreCommerce} onChange={(e) => setForm({ ...form, registreCommerce: e.target.value })} />
                <Input label="Article Imposition" value={form.articleImposition} onChange={(e) => setForm({ ...form, articleImposition: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Capital (DA)" value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} />
                <Input label="Code NAE" value={form.codeNae} onChange={(e) => setForm({ ...form, codeNae: e.target.value })} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="N. Auto-Entrepreneur" value={form.numeroAutoEntrepreneur} onChange={(e) => setForm({ ...form, numeroAutoEntrepreneur: e.target.value })} />
              <Input label="Activite" value={form.activiteExercee} onChange={(e) => setForm({ ...form, activiteExercee: e.target.value })} />
            </div>
          )}
          <Input label="Domaine d'activite" value={form.domaineActivite} onChange={(e) => setForm({ ...form, domaineActivite: e.target.value })} />
          <Input label="Siege Social" value={form.adresseSiegeSocial} onChange={(e) => setForm({ ...form, adresseSiegeSocial: e.target.value })} />
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={loading} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Save className="w-4 h-4 mr-1" />Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Raison Sociale" value={demande.raisonSociale} icon={<Building className="w-3.5 h-3.5" />} />
            <Field label="Forme Juridique" value={demande.formeJuridique} icon={<FileText className="w-3.5 h-3.5" />} />
            {isSociete ? (
              <>
                <Field label="NIF" value={demande.nif} icon={<Hash className="w-3.5 h-3.5" />} />
                <Field label="NIS" value={demande.nis} icon={<Hash className="w-3.5 h-3.5" />} />
                <Field label="Registre Commerce" value={demande.registreCommerce} icon={<FileText className="w-3.5 h-3.5" />} />
                <Field label="Article Imposition" value={demande.articleImposition} icon={<FileText className="w-3.5 h-3.5" />} />
                {demande.capital && <Field label="Capital" value={`${demande.capital} DA`} icon={<Banknote className="w-3.5 h-3.5" />} />}
              </>
            ) : (
              <>
                <Field label="N. Auto-Entrepreneur" value={demande.numeroAutoEntrepreneur} icon={<Hash className="w-3.5 h-3.5" />} />
                <Field label="Activite" value={demande.activiteExercee} icon={<FileText className="w-3.5 h-3.5" />} />
              </>
            )}
            {demande.domaineActivite && <Field label="Domaine" value={demande.domaineActivite} />}
            {demande.codeNae && <Field label="Code NAE" value={demande.codeNae} />}
            {demande.adresseSiegeSocial && <Field label="Siege Social" value={demande.adresseSiegeSocial} icon={<MapPin className="w-3.5 h-3.5" />} />}
            {demande.villeImmatriculation && <Field label="Ville Immat." value={demande.villeImmatriculation} icon={<MapPin className="w-3.5 h-3.5" />} />}
          </div>
        </div>
      )}

      {rep && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            Representant Legal
          </h3>
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{rep.prenom} {rep.nom}</p>
                {rep.fonction && <p className="text-sm text-gray-600">{rep.fonction}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {rep.email && (
                <a href={`mailto:${rep.email}`} className="flex items-center gap-2 text-amber-700 hover:text-amber-800">
                  <Mail className="w-3.5 h-3.5" />{rep.email}
                </a>
              )}
              {rep.telephone && (
                <a href={`tel:${rep.telephone}`} className="flex items-center gap-2 text-amber-700 hover:text-amber-800">
                  <Phone className="w-3.5 h-3.5" />{rep.telephone}
                </a>
              )}
              {rep.ville && (
                <div className="flex items-center gap-2 text-amber-700">
                  <MapPin className="w-3.5 h-3.5" />{rep.ville}
                </div>
              )}
              {rep.adresseResidence && (
                <div className="flex items-center gap-2 text-amber-700">
                  <MapPin className="w-3.5 h-3.5" />{rep.adresseResidence}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 flex items-center gap-4">
        <span>Cree le {formatDate(demande.dateCreation)}</span>
        {demande.updatedAt && <span>Mis a jour le {formatDate(demande.updatedAt)}</span>}
      </div>
    </div>
  );
}

function ContratTab({ demande, onUpdate, loading }: { demande: DemandeDomiciliation; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    numeroBureau: demande.numeroBureau?.toString() || "",
    referenceContratNotarie: demande.referenceContratNotarie || "",
    dateDebutContrat: "",
    dateFinContrat: "",
    montantMensuel: demande.montantMensuel?.toString() || "",
    modePaiement: demande.modePaiement || "",
    visibleSurSite: demande.visibleSurSite || false,
  });

  useEffect(() => {
    const toDateStr = (v: Date | string | undefined) => {
      if (!v) return "";
      try { return new Date(v as string).toISOString().split("T")[0]; } catch { return ""; }
    };
    setForm({
      numeroBureau: demande.numeroBureau?.toString() || "",
      referenceContratNotarie: demande.referenceContratNotarie || "",
      dateDebutContrat: toDateStr(demande.dateDebutContrat),
      dateFinContrat: toDateStr(demande.dateFinContrat),
      montantMensuel: demande.montantMensuel?.toString() || "",
      modePaiement: demande.modePaiement || "",
      visibleSurSite: demande.visibleSurSite || false,
    });
    setEditing(false);
  }, [demande]);

  const handleSave = async () => {
    try {
      await onUpdate({
        numeroBureau: form.numeroBureau ? parseInt(form.numeroBureau) : null,
        referenceContratNotarie: form.referenceContratNotarie,
        dateDebutContrat: form.dateDebutContrat || null,
        dateFinContrat: form.dateFinContrat || null,
        montantMensuel: form.montantMensuel ? parseFloat(form.montantMensuel) : null,
        modePaiement: form.modePaiement,
        visibleSurSite: form.visibleSurSite,
      });
      setEditing(false);
    } catch { /* handled upstream */ }
  };

  const opts = demande.options;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Details du contrat</h3>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          {editing ? <><X className="w-4 h-4 mr-1" />Annuler</> : <><Pencil className="w-4 h-4 mr-1" />Modifier</>}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero de bureau (1-36)</label>
              <select
                value={form.numeroBureau}
                onChange={(e) => setForm({ ...form, numeroBureau: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
              >
                <option value="">Non attribue</option>
                {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Bureau {n}</option>
                ))}
              </select>
            </div>
            <Input label="Reference contrat notarie" value={form.referenceContratNotarie} onChange={(e) => setForm({ ...form, referenceContratNotarie: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Date debut" type="date" value={form.dateDebutContrat} onChange={(e) => setForm({ ...form, dateDebutContrat: e.target.value })} />
            <Input label="Date fin" type="date" value={form.dateFinContrat} onChange={(e) => setForm({ ...form, dateFinContrat: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Montant mensuel (DA)" value={form.montantMensuel} onChange={(e) => setForm({ ...form, montantMensuel: e.target.value })} />
            <Input label="Mode de paiement" value={form.modePaiement} onChange={(e) => setForm({ ...form, modePaiement: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.visibleSurSite} onChange={(e) => setForm({ ...form, visibleSurSite: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded" />
            <span className="text-sm text-gray-700">Visible sur le site</span>
          </label>
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={loading} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Save className="w-4 h-4 mr-1" />Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Bureau" value={demande.numeroBureau ? `Bureau ${demande.numeroBureau}` : null} icon={<Hash className="w-3.5 h-3.5" />} />
          <Field label="Reference contrat" value={demande.referenceContratNotarie} icon={<Scale className="w-3.5 h-3.5" />} />
          <Field label="Montant mensuel" value={demande.montantMensuel ? formatCurrency(demande.montantMensuel) : null} icon={<Banknote className="w-3.5 h-3.5" />} />
          <Field label="Date debut" value={demande.dateDebutContrat ? formatDate(demande.dateDebutContrat) : null} icon={<Calendar className="w-3.5 h-3.5" />} />
          <Field label="Date fin" value={demande.dateFinContrat ? formatDate(demande.dateFinContrat) : null} icon={<Calendar className="w-3.5 h-3.5" />} />
          <Field label="Mode paiement" value={demande.modePaiement} />
          <Field label="Visible sur site" value={demande.visibleSurSite ? "Oui" : "Non"} />
        </div>
      )}

      {opts && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            Options souscrites
          </h3>
          <div className="space-y-2">
            {Object.entries(opts).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-700">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <Badge variant={val ? "success" : "default"} size="sm">{val ? "Actif" : "Inactif"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CourrierItem {
  id: string;
  type: string;
  expediteur: string;
  description: string;
  statut: string;
  dateReception: string;
  dateRetrait?: string;
}

function CourrierTab({ demande }: { demande: DemandeDomiciliation }) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCourrier, setNewCourrier] = useState({ type: "lettre", expediteur: "", description: "" });
  const [saving, setSaving] = useState(false);

  const loadCourrier = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserCourrier(demande.id);
      const data = response.data as Record<string, unknown> | undefined;
      setCourriers((data?.courriers || []) as CourrierItem[]);
    } catch { setCourriers([]); }
    finally { setLoading(false); }
  }, [demande.id]);

  useEffect(() => { loadCourrier(); }, [loadCourrier]);

  const handleCreate = async () => {
    if (!newCourrier.expediteur.trim()) { toast.error("L'expediteur est requis"); return; }
    setSaving(true);
    try {
      await apiClient.createCourrier({
        domiciliation_id: demande.id,
        ...newCourrier,
      });
      toast.success("Courrier ajoute");
      setCreating(false);
      setNewCourrier({ type: "lettre", expediteur: "", description: "" });
      await loadCourrier();
    } catch { toast.error("Erreur lors de l'ajout"); }
    finally { setSaving(false); }
  };

  const handleMarkRetire = async (id: string) => {
    try {
      await apiClient.updateCourrier(id, { statut: "retire" });
      toast.success("Courrier marque comme retire");
      await loadCourrier();
    } catch { toast.error("Erreur"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{courriers.length} courrier{courriers.length !== 1 ? "s" : ""}</h3>
        <Button size="sm" onClick={() => setCreating(!creating)} variant={creating ? "outline" : "primary"}>
          {creating ? <><X className="w-4 h-4 mr-1" />Annuler</> : <><Plus className="w-4 h-4 mr-1" />Ajouter</>}
        </Button>
      </div>

      {creating && (
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newCourrier.type}
                  onChange={(e) => setNewCourrier({ ...newCourrier, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="lettre">Lettre</option>
                  <option value="colis">Colis</option>
                  <option value="recommande">Recommande</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <Input label="Expediteur" value={newCourrier.expediteur} onChange={(e) => setNewCourrier({ ...newCourrier, expediteur: e.target.value })} />
            </div>
            <Input label="Description" value={newCourrier.description} onChange={(e) => setNewCourrier({ ...newCourrier, description: e.target.value })} />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleCreate} loading={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Send className="w-4 h-4 mr-1" />Enregistrer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {courriers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucun courrier enregistre</div>
      ) : (
        <div className="space-y-2">
          {courriers.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.type} - {c.expediteur}</p>
                  {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                  <p className="text-xs text-gray-400">{formatDate(c.dateReception)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.statut === "retire" ? "success" : c.statut === "notifie" ? "info" : "warning"} size="sm">
                  {c.statut}
                </Badge>
                {c.statut !== "retire" && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkRetire(c.id)}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />Retire
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentRecord {
  id: string;
  document_type: string;
  file_name: string;
  status?: string;
  created_at: string;
}

function DocumentsTab({ demande }: { demande: DemandeDomiciliation }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDocuments("domiciliation", demande.id);
      const data = response.data;
      if (Array.isArray(data)) setDocuments(data as DocumentRecord[]);
      else if (data && typeof data === "object" && "documents" in data) setDocuments((data as Record<string, unknown>).documents as DocumentRecord[] || []);
      else setDocuments([]);
    } catch { setDocuments([]); }
    finally { setLoading(false); }
  }, [demande.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleStatusChange = async (docId: string, status: string) => {
    try {
      await apiClient.put(`/documents/update.php?id=${docId}`, { status });
      toast.success("Statut du document mis a jour");
      await loadDocs();
    } catch { toast.error("Erreur"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{documents.length} document{documents.length !== 1 ? "s" : ""}</h3>
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucun document soumis</div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                  <p className="text-xs text-gray-500">{doc.document_type} - {formatDate(doc.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={doc.status || "en_attente"}
                  onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="en_attente">En attente</option>
                  <option value="valide">Valide</option>
                  <option value="rejete">Rejete</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ demande, onUpdate, loading }: { demande: DemandeDomiciliation; onUpdate: (d: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [notes, setNotes] = useState(demande.commentaireAdmin || "");
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    setNotes(demande.commentaireAdmin || "");
    setChanged(false);
  }, [demande]);

  const handleSave = async () => {
    try {
      await onUpdate({ commentaireAdmin: notes });
      setChanged(false);
    } catch { /* handled upstream */ }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Notes administratives</h3>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setChanged(true); }}
        rows={8}
        placeholder="Ajouter des notes internes sur cette domiciliation..."
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm resize-y"
      />
      {changed && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={loading} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            <Save className="w-4 h-4 mr-1" />Enregistrer les notes
          </Button>
        </div>
      )}
    </div>
  );
}

function ActionsTab({ demande, onAction, loading }: { demande: DemandeDomiciliation; onAction: (a: string, d?: Record<string, unknown>) => Promise<void>; loading: boolean }) {
  const [motif, setMotif] = useState("");
  const [signerForm, setSignerForm] = useState({
    numeroBureau: "",
    referenceContratNotarie: "",
    dateDebutContrat: "",
    dateFinContrat: "",
    montantMensuel: "12000",
  });
  const [confirmDestructive, setConfirmDestructive] = useState<string | null>(null);

  const actions = getAvailableActions(demande.statut);

  const handleAction = (action: string) => {
    if (action === "rejeter" || action === "resilier") {
      if (!confirmDestructive) { setConfirmDestructive(action); return; }
      if (!motif.trim()) { toast.error("Le motif est obligatoire"); return; }
      onAction(action, { motif });
      setConfirmDestructive(null);
      setMotif("");
      return;
    }

    if (action === "signer") {
      if (!signerForm.numeroBureau || !signerForm.referenceContratNotarie || !signerForm.dateDebutContrat || !signerForm.dateFinContrat) {
        toast.error("Tous les champs du contrat sont requis");
        return;
      }
      onAction("signer", {
        numeroBureau: parseInt(signerForm.numeroBureau),
        referenceContratNotarie: signerForm.referenceContratNotarie,
        dateDebutContrat: signerForm.dateDebutContrat,
        dateFinContrat: signerForm.dateFinContrat,
        montantMensuel: parseFloat(signerForm.montantMensuel),
      });
      return;
    }

    onAction(action, motif ? { motif } : undefined);
  };

  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune action disponible pour le statut actuel.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-600">
          Statut actuel : <span className="font-semibold text-gray-900">{demande.statut.replace(/_/g, " ")}</span>
        </p>
      </div>

      {actions.includes("signer") && (
        <Card className="p-5 border-sky-200 bg-sky-50/30">
          <h4 className="font-semibold text-sky-900 mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Enregistrement du contrat notarie
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bureau</label>
                <select
                  value={signerForm.numeroBureau}
                  onChange={(e) => setSignerForm({ ...signerForm, numeroBureau: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Selectionner</option>
                  {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>Bureau {n}</option>
                  ))}
                </select>
              </div>
              <Input label="Reference contrat" value={signerForm.referenceContratNotarie} onChange={(e) => setSignerForm({ ...signerForm, referenceContratNotarie: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date debut" type="date" value={signerForm.dateDebutContrat} onChange={(e) => setSignerForm({ ...signerForm, dateDebutContrat: e.target.value })} />
              <Input label="Date fin" type="date" value={signerForm.dateFinContrat} onChange={(e) => setSignerForm({ ...signerForm, dateFinContrat: e.target.value })} />
            </div>
            <Input label="Montant mensuel (DA)" value={signerForm.montantMensuel} onChange={(e) => setSignerForm({ ...signerForm, montantMensuel: e.target.value })} />
          </div>
        </Card>
      )}

      {confirmDestructive && (
        <Card className="p-5 border-red-200 bg-red-50/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-900">
              {confirmDestructive === "rejeter" ? "Confirmer le refus" : "Confirmer la resiliation"}
            </h4>
          </div>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            placeholder="Motif obligatoire..."
            className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm mb-3"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setConfirmDestructive(null); setMotif(""); }}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" loading={loading} onClick={() => handleAction(confirmDestructive)}>
              Confirmer
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {actions.includes("valider") && (
          <Button onClick={() => handleAction("valider")} loading={loading} className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />Valider le dossier
          </Button>
        )}
        {actions.includes("signer") && (
          <Button onClick={() => handleAction("signer")} loading={loading} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white">
            <Scale className="w-4 h-4 mr-2" />Enregistrer la signature
          </Button>
        )}
        {actions.includes("activer") && (
          <Button onClick={() => handleAction("activer")} loading={loading} className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />Activer la domiciliation
          </Button>
        )}
        {actions.includes("rejeter") && !confirmDestructive && (
          <Button variant="danger" onClick={() => handleAction("rejeter")} loading={loading}>
            <XCircle className="w-4 h-4 mr-2" />Refuser
          </Button>
        )}
        {actions.includes("resilier") && !confirmDestructive && (
          <Button variant="danger" onClick={() => handleAction("resilier")} loading={loading}>
            <Ban className="w-4 h-4 mr-2" />Resilier
          </Button>
        )}
      </div>
    </div>
  );
}

function getAvailableActions(statut: string): string[] {
  switch (statut) {
    case "dossier_preparatoire":
      return ["valider", "rejeter"];
    case "en_attente_signature":
      return ["signer", "rejeter"];
    case "domiciliation_creee":
    case "en_attente_complements":
      return ["activer"];
    case "active":
      return ["resilier"];
    default:
      return [];
  }
}

export default DomiciliationDetailModal;
