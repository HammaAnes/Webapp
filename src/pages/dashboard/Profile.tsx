import React, { useState, useRef, useCallback } from "react";
import { User, Mail, Phone, Building, FileEdit as Edit2, Save, X, CreditCard, CheckCircle2, AlertCircle, Loader2, FileText, ExternalLink, Trash2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { apiClient } from "../../lib/api-client";
import toast from "react-hot-toast";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const IdCardUpload: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, loadUser } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setPreview(URL.createObjectURL(file));
        setPreviewType("image");
      } else {
        setPreview(null);
        setPreviewType("pdf");
      }
      setUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 12, 85));
      }, 180);

      try {
        const uploadRes = await apiClient.uploadDocument(file, "user", user!.id, "carte_identite");
        clearInterval(progressInterval);
        const cheminFichier = (uploadRes.data as Record<string, string> | undefined)?.chemin_fichier;
        if (uploadRes.success && cheminFichier) {
          setUploadProgress(90);
          const updateRes = await apiClient.updateUser(user!.id, { carteIdentiteUrl: cheminFichier });
          if (!updateRes.success) {
            toast.error("Document uploadé mais enregistrement échoué. Réessayez.");
            setUploadProgress(0);
            return;
          }
          setUploadProgress(100);
          await loadUser();
          toast.success("Carte d'identité enregistrée !");
          onComplete();
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
    [user, loadUser, onComplete]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleInputChange}
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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
            <div
              className="h-full bg-sky-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const IdCardSection: React.FC = () => {
  const { user, loadUser } = useAuthStore();
  const [replacing, setReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 12, 85));
      }, 180);
      try {
        const uploadRes = await apiClient.uploadDocument(file, "user", user!.id, "carte_identite");
        clearInterval(progressInterval);
        const cheminFichier = (uploadRes.data as Record<string, string> | undefined)?.chemin_fichier;
        if (uploadRes.success && cheminFichier) {
          setUploadProgress(90);
          const updateRes = await apiClient.updateUser(user!.id, { carteIdentiteUrl: cheminFichier });
          if (!updateRes.success) {
            toast.error("Document uploadé mais enregistrement échoué. Réessayez.");
            setUploadProgress(0);
            return;
          }
          setUploadProgress(100);
          await loadUser();
          toast.success("Document remplacé !");
          setReplacing(false);
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
    [user, loadUser]
  );

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processReplace(file);
  };

  const isPdf = user?.carteIdentiteUrl
    ? user.carteIdentiteUrl.toLowerCase().endsWith(".pdf")
    : false;

  if (!user?.carteIdentiteUrl) {
    return <IdCardUpload onComplete={() => {}} />;
  }

  if (replacing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Choisir un nouveau document</p>
          <button
            onClick={() => setReplacing(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Annuler
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleReplace}
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
              <div
                className="h-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      {!isPdf && (
        <div className="border-b border-gray-200 bg-white">
          <img
            src={`/api/${user.carteIdentiteUrl}`}
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
            href={`/api/${user.carteIdentiteUrl}`}
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

const Profile = () => {
  const { user, loadUser } = useAuthStore();
  const { updateUser } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    entreprise: user?.entreprise || "",
    profession: user?.profession || "",
    adresse: user?.adresse || "",
    bio: user?.bio || "",
  });

  const performUpdate = async () => {
    if (!user) return;
    try {
      await updateUser(user.id, formData);
      await loadUser();
      toast.success("Profil mis à jour");
      setIsEditing(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performUpdate();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mon Profil</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                nom: user.nom || "",
                prenom: user.prenom || "",
                email: user.email || "",
                telephone: user.telephone || "",
                entreprise: user.entreprise || "",
                profession: user.profession || "",
                adresse: user.adresse || "",
                bio: user.bio || "",
              });
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        )}
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Prénom"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              disabled={!isEditing}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              disabled={!isEditing}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Téléphone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              disabled={!isEditing}
              icon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="Entreprise"
              value={formData.entreprise}
              onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
              disabled={!isEditing}
              icon={<Building className="w-4 h-4" />}
            />
            <Input
              label="Profession"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <Input
            label="Adresse"
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            disabled={!isEditing}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
            />
          </div>

          {isEditing && (
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          )}
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Carte d'identité nationale</h2>
              <p className="text-sm text-gray-500">Requise pour effectuer des réservations</p>
            </div>
          </div>
          {user.carteIdentiteUrl ? (
            <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Enregistrée
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-700 text-sm font-medium bg-amber-50 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Non fournie
            </span>
          )}
        </div>

        <IdCardSection />

        <p className="mt-4 text-xs text-gray-400">
          Vos documents sont stockés de façon sécurisée et ne sont utilisés qu'à des fins de vérification d'identité. Cette démarche est unique.
        </p>
      </Card>
    </div>
  );
};

export default Profile;
