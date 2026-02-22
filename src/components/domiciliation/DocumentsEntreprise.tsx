import React, { useState, useEffect, useRef } from "react";
import { FileText, Upload, Download, Trash2, CheckCircle, AlertCircle, Loader2, File, Eye, FolderOpen } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import LoadingSpinner from "../ui/LoadingSpinner";
import Modal from "../ui/Modal";
import { apiClient } from "../../lib/api-client";
import toast from "react-hot-toast";

interface DocumentRecord {
  id: string;
  document_type: string;
  file_name: string;
  file_size?: number;
  created_at: string;
  url?: string;
  status?: "en_attente" | "valide" | "rejete";
}

interface DocumentSlot { type: string; label: string; required: boolean; description: string }

const SOCIETE_DOCS: DocumentSlot[] = [
  { type: "rc", label: "Registre de Commerce", required: true, description: "Copie du registre de commerce" },
  { type: "nif", label: "NIF", required: true, description: "Numéro d'Identification Fiscale" },
  { type: "nis", label: "NIS", required: true, description: "Numéro d'Identification Statistique" },
  { type: "c20", label: "Extrait C20", required: true, description: "Extrait du registre de commerce (modèle C20)" },
  { type: "statuts", label: "Statuts", required: false, description: "Statuts de la société" },
  { type: "cni", label: "CNI du gérant", required: true, description: "Copie de la carte d'identité du gérant" },
];

const AUTO_ENTREPRENEUR_DOCS: DocumentSlot[] = [
  { type: "carte_ae", label: "Carte Auto-Entrepreneur", required: true, description: "Carte d'auto-entrepreneur délivrée par l'ANADE" },
  { type: "cni", label: "CNI", required: true, description: "Copie de la carte d'identité nationale" },
];

const COMMON_DOCS: DocumentSlot[] = [
  { type: "autre", label: "Autre document", required: false, description: "Document supplémentaire" },
];

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
  en_attente: { label: "En attente", variant: "warning" },
  valide: { label: "Validé", variant: "success" },
  rejete: { label: "Rejeté", variant: "danger" },
};

interface DocumentsEntrepriseProps {
  domiciliationId: string;
  typeStructure: "societe" | "auto_entrepreneur";
  readOnly?: boolean;
}

function ActionBtn({ onClick, icon: Icon, label, cls }: { onClick: () => void; icon: React.FC<{ className?: string }>; label: string; cls: string }) {
  return (
    <button onClick={onClick} className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${cls}`}>
      <Icon className="w-3 h-3" />{label}
    </button>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsEntreprise({ domiciliationId, typeStructure, readOnly = false }: DocumentsEntrepriseProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const requiredSlots = typeStructure === "auto_entrepreneur" ? AUTO_ENTREPRENEUR_DOCS : SOCIETE_DOCS;
  const allSlots = [...requiredSlots, ...COMMON_DOCS];
  const getDoc = (type: string) => documents.find((d) => d.document_type === type);

  useEffect(() => { loadDocuments(); }, [domiciliationId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDocuments("domiciliation", domiciliationId);
      const data = response.data;
      if (Array.isArray(data)) setDocuments(data as DocumentRecord[]);
      else if (data && typeof data === "object" && "documents" in data)
        setDocuments((data as Record<string, unknown>).documents as DocumentRecord[] || []);
      else setDocuments([]);
    } catch { setDocuments([]); }
    finally { setLoading(false); }
  };

  const handleUploadClick = (docType: string) => { setUploadTarget(docType); fileRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Le fichier ne doit pas dépasser 5 Mo"); return; }
    if (!["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Format accepté : PDF, JPG, PNG"); return;
    }
    try {
      setUploading(uploadTarget);
      const res = await apiClient.uploadDocument(file, "domiciliation", domiciliationId, uploadTarget);
      if (res.success) { toast.success("Document téléchargé avec succès"); await loadDocuments(); }
      else toast.error(res.error || "Erreur lors du téléchargement");
    } catch { toast.error("Erreur lors de l'envoi du document"); }
    finally { setUploading(null); setUploadTarget(""); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiClient.deleteDocument(deleteTarget.id);
      if (res.success) { toast.success("Document supprimé"); setDeleteTarget(null); await loadDocuments(); }
      else toast.error(res.error || "Erreur lors de la suppression");
    } catch { toast.error("Erreur lors de la suppression"); }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const res = await apiClient.downloadDocument(doc.id);
      const dlData = res.data as Record<string, unknown> | undefined;
      if (dlData && typeof dlData === "object" && "url" in dlData && dlData.url) { window.open(dlData.url as string, "_blank"); return; }
      if (res.data instanceof Blob) {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url; a.download = doc.file_name; a.click(); URL.revokeObjectURL(url); return;
      }
      toast.error("Impossible de télécharger le document");
    } catch { toast.error("Erreur lors du téléchargement"); }
  };

  const handlePreview = (doc: DocumentRecord) => {
    const ext = doc.file_name.split(".").pop()?.toLowerCase();
    if (["pdf", "jpg", "jpeg", "png"].includes(ext || "") && doc.url) setPreviewUrl(doc.url);
    else handleDownload(doc);
  };

  const uploadedCount = requiredSlots.filter((s) => s.required && getDoc(s.type)).length;
  const totalRequired = requiredSlots.filter((s) => s.required).length;
  const pct = totalRequired > 0 ? Math.round((uploadedCount / totalRequired) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">Progression des documents</h3>
            <p className="text-sm text-gray-500">{uploadedCount} sur {totalRequired} documents requis</p>
          </div>
          <span className={`text-2xl font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
        </div>
        {pct === 100 && (
          <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />Tous les documents requis ont été fournis
          </p>
        )}
      </Card>

      {documents.length === 0 && (
        <Card className="p-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Aucun document</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {readOnly ? "Aucun document n'a encore été soumis pour ce dossier." : "Commencez par télécharger les documents requis ci-dessous pour compléter votre dossier."}
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allSlots.map((slot) => {
          const doc = getDoc(slot.type);
          const isUploading = uploading === slot.type;
          const st = doc?.status ? STATUS_MAP[doc.status] : null;
          return (
            <Card key={slot.type} className={`p-4 transition-all ${doc ? "border-emerald-200 bg-emerald-50/30" : slot.required ? "border-amber-200 bg-amber-50/30" : "border-gray-200"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc ? "bg-emerald-100" : slot.required ? "bg-amber-100" : "bg-gray-100"}`}>
                  {doc ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <FileText className={`w-5 h-5 ${slot.required ? "text-amber-600" : "text-gray-400"}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">{slot.label}</p>
                    {slot.required && !doc && <Badge variant="warning">Requis</Badge>}
                    {st && <Badge variant={st.variant} size="sm">{st.label}</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{slot.description}</p>
                  {doc && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <File className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-700 truncate">{doc.file_name}</span>
                      {doc.file_size && <span className="text-gray-400">{formatFileSize(doc.file_size)}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {doc ? (
                      <>
                        <ActionBtn onClick={() => handlePreview(doc)} icon={Eye} label="Aperçu" cls="text-teal-700 hover:text-teal-900 hover:bg-teal-50" />
                        <ActionBtn onClick={() => handleDownload(doc)} icon={Download} label="Télécharger" cls="text-gray-600 hover:text-gray-900 hover:bg-gray-100" />
                        {!readOnly && (
                          <>
                            <ActionBtn onClick={() => handleUploadClick(slot.type)} icon={Upload} label="Remplacer" cls="text-gray-600 hover:text-gray-900 hover:bg-gray-100" />
                            <ActionBtn onClick={() => setDeleteTarget(doc)} icon={Trash2} label="Supprimer" cls="text-red-600 hover:text-red-700 hover:bg-red-50" />
                          </>
                        )}
                      </>
                    ) : !readOnly ? (
                      <button onClick={() => handleUploadClick(slot.type)} disabled={isUploading} className="text-xs text-white bg-gray-800 hover:bg-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? "Envoi..." : "Télécharger"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!readOnly && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Formats acceptés</p>
              <p>PDF, JPG, PNG -- Taille maximale : 5 Mo par fichier</p>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le document">
        <div className="space-y-4">
          <p className="text-gray-700">Êtes-vous sûr de vouloir supprimer le document <strong>{deleteTarget?.file_name}</strong> ?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Aperçu du document" size="lg">
        {previewUrl && <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg border border-gray-200" title="Aperçu" />}
      </Modal>
    </div>
  );
}
