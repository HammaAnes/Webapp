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
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { apiClient } from "../../../lib/api-client";
import { useDocuments } from "../hooks";
import { getAllDocSlots, formatFileSize } from "../utils";
import { DOCUMENT_STATUS_CONFIG } from "../constants";
import type { DemandeDomiciliation, DocumentRecord } from "../types";

interface Props {
  demande: DemandeDomiciliation;
}

async function triggerDownload(doc: DocumentRecord) {
  const res = await apiClient.downloadDocument(doc.id);
  if (res.success && res.blob) {
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename || doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    throw new Error(res.error || "Impossible de télécharger");
  }
}

async function openPreview(doc: DocumentRecord): Promise<string | null> {
  const ext = doc.fileName.split(".").pop()?.toLowerCase();
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
  const getDoc = (type: string) => docs.find((d) => d.documentType === type);

  const requiredSlots = allSlots.filter((s) => s.required);
  const uploadedRequired = requiredSlots.filter((s) => getDoc(s.type)).length;
  const pct = requiredSlots.length > 0 ? Math.round((uploadedRequired / requiredSlots.length) * 100) : 100;

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
      const res = await apiClient.updateDocumentStatus(rejectModal.id, "rejete", rejectComment || undefined);
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

  const extraDocs = docs.filter((d) => !allSlots.some((s) => s.type === d.documentType));

  return (
    <div className="space-y-5">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Documents</h3>
            <p className="text-xs text-gray-500">{docs.length} fichier{docs.length !== 1 ? "s" : ""} · {uploadedRequired}/{requiredSlots.length} requis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {pct}%
          </span>
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {allSlots.map((slot) => {
            const doc = getDoc(slot.type);
            const isUpl = uploading === slot.type;
            const statusCfg = doc?.status ? DOCUMENT_STATUS_CONFIG[doc.status] : null;

            return (
              <div
                key={slot.type}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                  doc
                    ? doc.status === "rejete"
                      ? "bg-red-50/40 border-red-200"
                      : doc.status === "valide"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-white border-gray-200"
                    : slot.required
                    ? "bg-amber-50/20 border-amber-200 border-dashed"
                    : "bg-gray-50/40 border-gray-200 border-dashed"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  doc
                    ? doc.status === "valide" ? "bg-emerald-100" : doc.status === "rejete" ? "bg-red-100" : "bg-blue-100"
                    : "bg-gray-100"
                }`}>
                  {doc ? (
                    <File className={`w-5 h-5 ${
                      doc.status === "valide" ? "text-emerald-600" : doc.status === "rejete" ? "text-red-600" : "text-blue-600"
                    }`} />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{slot.label}</p>
                    {slot.required && !doc && (
                      <Badge variant="warning" size="sm">Requis</Badge>
                    )}
                    {statusCfg && (
                      <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
                    )}
                  </div>
                  {doc ? (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {doc.fileName}
                      {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Aucun fichier</p>
                  )}
                  {doc?.status === "rejete" && doc.commentaireRejet && (
                    <p className="text-xs text-red-600 mt-0.5 font-medium">{doc.commentaireRejet}</p>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  {doc ? (
                    <>
                      <button
                        onClick={() => handlePreview(doc)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePreview(doc).then(() => triggerDownload(doc)).catch(() => triggerDownload(doc))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {doc.status !== "valide" && (
                        <button
                          onClick={() => handleValidate(doc)}
                          className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Valider"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {doc.status !== "rejete" && (
                        <button
                          onClick={() => { setRejectModal(doc); setRejectComment(""); }}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Rejeter"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleUploadClick(slot.type)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                        title="Remplacer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUploadClick(slot.type)}
                      disabled={isUpl}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                      {isUpl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {isUpl ? "Envoi..." : "Uploader"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {extraDocs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <FolderOpen className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-600">Autres documents</h4>
            <span className="text-xs text-gray-400">({extraDocs.length})</span>
          </div>
          {extraDocs.map((doc) => {
            const statusCfg = doc.status ? DOCUMENT_STATUS_CONFIG[doc.status] : null;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3.5 rounded-xl border bg-gray-50 border-gray-200"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{doc.documentType}</p>
                    {statusCfg && <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {doc.fileName}{doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handlePreview(doc)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  {doc.status !== "valide" && (
                    <button onClick={() => handleValidate(doc)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(doc)} className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Rejeter le document"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rejeter <strong>{rejectModal?.fileName}</strong>. Un commentaire peut être laissé à l'utilisateur.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Motif du rejet (optionnel)</label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              placeholder="Ex : Document illisible, veuillez renvoyer une copie plus nette..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleReject}>
              <XCircle className="w-4 h-4" /> Rejeter
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
        title="Aperçu du document"
        size="lg"
      >
        {previewUrl && (
          <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg border border-gray-200" title="Aperçu" />
        )}
      </Modal>
    </div>
  );
}
