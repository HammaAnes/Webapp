import React, { useState, useRef } from "react";
import {
  FileText,
  File,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { apiClient } from "../../../lib/api-client";
import { useDocuments } from "../hooks";
import { getAllDocSlots, formatFileSize, mapApiDocument } from "../utils";
import type { DemandeDomiciliation, DocumentRecord } from "../types";

interface Props {
  demande: DemandeDomiciliation;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" }
> = {
  en_attente: { label: "En attente", variant: "warning" },
  valide: { label: "Validé", variant: "success" },
  rejete: { label: "Rejeté", variant: "danger" },
};

function SectionHeader({ icon: Icon, title, gradient }: { icon: React.ElementType; title: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-bold text-gray-900 text-base">{title}</h4>
    </div>
  );
}

async function triggerDownload(doc: DocumentRecord) {
  const res = await apiClient.downloadDocument(doc.id);
  if (res.success && res.blob) {
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename || doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    throw new Error(res.error || "Impossible de télécharger");
  }
}

async function openPreview(doc: DocumentRecord): Promise<string | null> {
  const ext = doc.file_name.split(".").pop()?.toLowerCase();
  if (!["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return null;
  const res = await apiClient.downloadDocument(doc.id);
  if (res.success && res.blob) return URL.createObjectURL(res.blob);
  return null;
}

export default function DocumentsTab({ demande }: Props) {
  const { docs, loading, reload } = useDocuments(demande.id);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState("");
  const [rejectModal, setRejectModal] = useState<DocumentRecord | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const allSlots = getAllDocSlots(demande.situationAdministrative, demande.typeStructure);
  const getDoc = (type: string) => docs.find((d) => d.document_type === type);

  const requiredSlots = allSlots.filter((s) => s.required);
  const uploadedRequired = requiredSlots.filter((s) => getDoc(s.type)).length;
  const pct = requiredSlots.length > 0 ? Math.round((uploadedRequired / requiredSlots.length) * 100) : 0;

  const handleUploadClick = (type: string) => {
    setUploadTarget(type);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }
    try {
      setUploading(uploadTarget);
      const res = await apiClient.uploadDocument(file, "domiciliation", demande.id, uploadTarget);
      if (res.success) {
        toast.success("Document uploadé");
        await reload();
      } else {
        toast.error(res.error || "Erreur d'upload");
      }
    } catch {
      toast.error("Erreur d'upload");
    } finally {
      setUploading(null);
      setUploadTarget("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePreview = async (doc: DocumentRecord) => {
    try {
      const url = await openPreview(doc);
      if (url) setPreviewUrl(url);
      else await triggerDownload(doc);
    } catch {
      toast.error("Impossible d'ouvrir le document");
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      await triggerDownload(doc);
    } catch {
      toast.error("Erreur de téléchargement");
    }
  };

  const handleValidate = async (doc: DocumentRecord) => {
    try {
      const res = await apiClient.updateDocumentStatus(doc.id, "valide");
      if (res.success) {
        toast.success("Document validé");
        await reload();
      } else {
        toast.error(res.error || "Erreur");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      const res = await apiClient.updateDocumentStatus(
        rejectModal.id,
        "rejete",
        rejectComment || undefined
      );
      if (res.success) {
        toast.success("Document rejeté");
        setRejectModal(null);
        setRejectComment("");
        await reload();
      } else {
        toast.error(res.error || "Erreur");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDelete = async (doc: DocumentRecord) => {
    try {
      const res = await apiClient.deleteDocument(doc.id);
      if (res.success) {
        toast.success("Document supprimé");
        await reload();
      } else {
        toast.error(res.error || "Erreur");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const extraDocs = docs.filter((d) => !allSlots.some((s) => s.type === d.document_type));

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <SectionHeader
          icon={FileText}
          title={`Documents (${docs.length})`}
          gradient="from-teal-500 to-emerald-500"
        />
        <div className="flex items-center gap-3">
          <span
            className={`text-lg font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}
          >
            {pct}%
          </span>
          <span className="text-xs text-gray-500">
            {uploadedRequired}/{requiredSlots.length} requis
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {allSlots.map((slot) => {
          const doc = getDoc(slot.type);
          const isUpl = uploading === slot.type;
          const st = doc?.status ? STATUS_CONFIG[doc.status] : null;

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
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  doc
                    ? doc.status === "valide"
                      ? "bg-emerald-100"
                      : doc.status === "rejete"
                      ? "bg-red-100"
                      : "bg-teal-100"
                    : "bg-gray-100"
                }`}
              >
                {doc ? (
                  <File
                    className={`w-4 h-4 ${
                      doc.status === "valide"
                        ? "text-emerald-600"
                        : doc.status === "rejete"
                        ? "text-red-600"
                        : "text-teal-600"
                    }`}
                  />
                ) : (
                  <FileText className="w-4 h-4 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{slot.label}</p>
                  {slot.required && !doc && (
                    <Badge variant="warning" size="sm">
                      Requis
                    </Badge>
                  )}
                  {st && (
                    <Badge variant={st.variant} size="sm">
                      {st.label}
                    </Badge>
                  )}
                </div>
                {doc && (
                  <p className="text-xs text-gray-500 truncate">
                    {doc.file_name}
                    {doc.file_size ? ` (${formatFileSize(doc.file_size)})` : ""}
                  </p>
                )}
                {doc?.status === "rejete" && doc.commentaire_rejet && (
                  <p className="text-xs text-red-600 mt-0.5">{doc.commentaire_rejet}</p>
                )}
              </div>

              <div className="flex gap-1 flex-shrink-0">
                {doc ? (
                  <>
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-teal-600"
                      title="Aperçu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {doc.status !== "valide" && (
                      <button
                        onClick={() => handleValidate(doc)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                        title="Valider"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {doc.status !== "rejete" && (
                      <button
                        onClick={() => {
                          setRejectModal(doc);
                          setRejectComment("");
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                        title="Rejeter"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleUploadClick(slot.type)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Remplacer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleUploadClick(slot.type)}
                    disabled={isUpl}
                    className="text-xs bg-gray-800 text-white hover:bg-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {isUpl ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    {isUpl ? "Envoi..." : "Uploader"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {extraDocs.length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Autres documents téléchargés
            </h4>
          </div>
          <div className="space-y-2">
            {extraDocs.map((doc) => {
              const st = doc.status ? STATUS_CONFIG[doc.status] : null;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 border-gray-200"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-100">
                    <File className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{doc.document_type}</p>
                      {st && (
                        <Badge variant={st.variant} size="sm">
                          {st.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {doc.file_name}
                      {doc.file_size ? ` (${formatFileSize(doc.file_size)})` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-teal-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {doc.status !== "valide" && (
                      <button
                        onClick={() => handleValidate(doc)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Rejeter le document"
      >
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">
            Rejeter le document : <strong>{rejectModal?.file_name}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif du rejet</label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              placeholder="Ex : Document illisible, veuillez renvoyer une copie plus nette..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }}
        title="Aperçu du document"
        size="lg"
      >
        {previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-[60vh] rounded-lg border border-gray-200"
            title="Aperçu"
          />
        )}
      </Modal>
    </div>
  );
}
