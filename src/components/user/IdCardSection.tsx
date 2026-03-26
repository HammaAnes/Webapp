import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { apiClient } from "../../lib/api-client";
import toast from "react-hot-toast";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const resolveUrl = (path: string) =>
  path.startsWith("/api/") || path.startsWith("api/")
    ? `/${path.replace(/^\//, "")}`
    : `/api/${path}`;

const IdCardUpload: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, loadUser } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToProfile = useCallback(
    async (cheminFichier: string) => {
      if (!user?.id) return false;
      setUploadProgress(90);
      const updateRes = await apiClient.updateUser(user.id, { carteIdentiteUrl: cheminFichier });
      if (!updateRes.success) {
        const errMsg = (updateRes as { error?: string }).error || "Enregistrement échoué.";
        toast.error(`Document uploadé mais enregistrement échoué : ${errMsg}`);
        setPendingPath(cheminFichier);
        setUploadProgress(0);
        return false;
      }
      setUploadProgress(100);
      await loadUser();
      toast.success("Carte d'identité enregistrée !");
      setPendingPath(null);
      onComplete();
      return true;
    },
    [user, loadUser, onComplete]
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou PDF.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
        return;
      }
      if (file.type.startsWith("image/")) {
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        setPreviewType("image");
      } else {
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setPreviewType("pdf");
      }
      if (!user?.id) {
        toast.error("Session expirée, veuillez vous reconnecter.");
        return;
      }
      setUploading(true);
      setUploadProgress(0);
      setPendingPath(null);

      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 12, 85));
      }, 180);

      try {
        const uploadRes = await apiClient.uploadDocument(file, "user", user.id, "carte_identite");
        clearInterval(progressInterval);
        const cheminFichier = (uploadRes.data as Record<string, string> | undefined)?.chemin_fichier;
        if (uploadRes.success && cheminFichier) {
          await saveToProfile(cheminFichier);
        } else {
          toast.error((uploadRes as { error?: string }).error || "Erreur lors de l'upload.");
          setPreview(null);
          setPreviewType(null);
          setUploadProgress(0);
        }
      } catch {
        clearInterval(progressInterval);
        toast.error("Erreur lors de l'upload.");
        setPreview(null);
        setPreviewType(null);
        setUploadProgress(0);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [user, saveToProfile]
  );

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        className="hidden"
      />

      {preview && previewType === "image" && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={preview} alt="Aperçu" className="w-full max-h-52 object-contain" />
        </div>
      )}
      {previewType === "pdf" && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-sm text-gray-700 font-medium">Document PDF sélectionné</span>
        </div>
      )}

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          uploading
            ? "border-sky-300 bg-sky-50 cursor-default"
            : isDragging
            ? "border-sky-500 bg-sky-50 scale-[1.01]"
            : "border-gray-300 hover:border-sky-400 hover:bg-sky-50"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-6">
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
              <span className="text-sm font-medium text-sky-700">Enregistrement en cours…</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {isDragging ? "Déposer le fichier ici" : "Glisser-déposer ou cliquer pour choisir"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP ou PDF — max {MAX_SIZE_MB} Mo</p>
              </div>
            </>
          )}
        </div>
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-100">
            <div className="h-full bg-sky-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      {pendingPath && !uploading && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 flex-1">Fichier uploadé mais non enregistré dans votre profil.</p>
          <button
            onClick={() => saveToProfile(pendingPath)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

const IdCardSection: React.FC = () => {
  const { user, loadUser } = useAuthStore();
  const [replacing, setReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const saveToProfile = useCallback(
    async (cheminFichier: string) => {
      if (!user?.id) return false;
      setUploadProgress(90);
      const updateRes = await apiClient.updateUser(user.id, { carteIdentiteUrl: cheminFichier });
      if (!updateRes.success) {
        const errMsg = (updateRes as { error?: string }).error || "Enregistrement échoué.";
        toast.error(`Document uploadé mais enregistrement échoué : ${errMsg}`);
        setPendingPath(cheminFichier);
        setUploadProgress(0);
        return false;
      }
      setUploadProgress(100);
      await loadUser();
      toast.success("Document remplacé !");
      setPendingPath(null);
      setReplacing(false);
      return true;
    },
    [user, loadUser]
  );

  const processReplace = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou PDF.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
        return;
      }
      setUploading(true);
      setUploadProgress(0);
      setPendingPath(null);
      if (!user?.id) {
        toast.error("Session expirée, veuillez vous reconnecter.");
        return;
      }
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 12, 85));
      }, 180);
      try {
        const uploadRes = await apiClient.uploadDocument(file, "user", user.id, "carte_identite");
        clearInterval(progressInterval);
        const cheminFichier = (uploadRes.data as Record<string, string> | undefined)?.chemin_fichier;
        if (uploadRes.success && cheminFichier) {
          await saveToProfile(cheminFichier);
        } else {
          toast.error((uploadRes as { error?: string }).error || "Erreur lors de l'upload.");
          setUploadProgress(0);
        }
      } catch {
        clearInterval(progressInterval);
        toast.error("Erreur lors de l'upload.");
        setUploadProgress(0);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [user, saveToProfile]
  );

  const isPdf = user?.carteIdentiteUrl?.toLowerCase().endsWith(".pdf") ?? false;

  if (!user?.carteIdentiteUrl) {
    return <IdCardUpload onComplete={() => {}} />;
  }

  if (replacing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Choisir un nouveau document</p>
          <button onClick={() => setReplacing(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Annuler
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processReplace(f); }}
          className="hidden"
        />
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
            uploading ? "border-sky-300 bg-sky-50 cursor-default" : "border-gray-300 hover:border-sky-400 hover:bg-sky-50"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-6">
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                <span className="text-sm font-medium text-sky-700">Mise à jour en cours…</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Glisser-déposer ou cliquer pour choisir</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP ou PDF — max {MAX_SIZE_MB} Mo</p>
                </div>
              </>
            )}
          </div>
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-100">
              <div className="h-full bg-sky-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
        {pendingPath && !uploading && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 flex-1">Fichier uploadé mais non enregistré dans votre profil.</p>
            <button
              onClick={() => saveToProfile(pendingPath)}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      {!isPdf && (
        <div className="border-b border-gray-200 bg-white">
          <img
            src={resolveUrl(user.carteIdentiteUrl)}
            alt="Carte d'identité"
            className="w-full max-h-52 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {isPdf ? (
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-red-600" />
            </div>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span className="font-medium">{isPdf ? "Document PDF archivé" : "Document archivé"}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={resolveUrl(user.carteIdentiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir
          </a>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => setReplacing(true)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remplacer
          </button>
        </div>
      </div>
    </div>
  );
};

export { IdCardSection, IdCardUpload };
export default IdCardSection;
