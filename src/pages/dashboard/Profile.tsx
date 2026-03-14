import React, { useState, useRef, useCallback, useEffect } from "react";
import { User, Mail, Phone, Building, FileEdit as Edit2, Save, X, CreditCard, CheckCircle2, AlertCircle, Loader2, FileText, ExternalLink, Trash2, Bell } from "lucide-react";
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

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
            src={user.carteIdentiteUrl?.startsWith('/api/') || user.carteIdentiteUrl?.startsWith('api/') ? `/${user.carteIdentiteUrl?.replace(/^\//, '')}` : `/api/${user.carteIdentiteUrl}`}
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
            href={user.carteIdentiteUrl?.startsWith('/api/') || user.carteIdentiteUrl?.startsWith('api/') ? `/${user.carteIdentiteUrl?.replace(/^\//, '')}` : `/api/${user.carteIdentiteUrl}`}
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

interface EmailPrefs {
  email_transactionnel: boolean;
  email_rappels: boolean;
  email_marketing: boolean;
  email_systeme: boolean;
}

const EmailPreferences: React.FC = () => {
  const [prefs, setPrefs] = useState<EmailPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof EmailPrefs | null>(null);

  useEffect(() => {
    apiClient.getEmailPreferences().then((res) => {
      if (res.success && res.data) {
        const d = res.data as Record<string, unknown>;
        setPrefs({
          email_transactionnel: Boolean(d.email_transactionnel ?? true),
          email_rappels: Boolean(d.email_rappels ?? true),
          email_marketing: Boolean(d.email_marketing ?? true),
          email_systeme: Boolean(d.email_systeme ?? true),
        });
      }
      setLoading(false);
    });
  }, []);

  const handleToggle = async (key: keyof EmailPrefs) => {
    if (!prefs || key === "email_transactionnel") return;
    const newVal = !prefs[key];
    setSaving(key);
    const updated = { ...prefs, [key]: newVal };
    setPrefs(updated);
    try {
      const res = await apiClient.updateEmailPreferences({ [key]: newVal });
      if (!res.success) {
        setPrefs(prefs);
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      setPrefs(prefs);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

  const prefItems: { key: keyof EmailPrefs; label: string; description: string; locked?: boolean }[] = [
    { key: "email_transactionnel", label: "Emails transactionnels", description: "Confirmations de réservations, reçus de paiement — obligatoires", locked: true },
    { key: "email_rappels", label: "Rappels et notifications", description: "Rappels avant vos réservations, alertes d'expiration" },
    { key: "email_marketing", label: "Offres et promotions", description: "Codes promo, offres spéciales, actualités Coffice" },
    { key: "email_systeme", label: "Emails système", description: "Alertes de sécurité, changements de mot de passe" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prefItems.map((item) => {
        const isEnabled = prefs?.[item.key] ?? true;
        const isSaving = saving === item.key;
        return (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
            <button
              onClick={() => !item.locked && handleToggle(item.key)}
              disabled={item.locked || isSaving}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                item.locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              } ${isEnabled ? "bg-sky-600" : "bg-gray-200"}`}
              title={item.locked ? "Non modifiable" : undefined}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  isEnabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
              {isSaving && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                </span>
              )}
            </button>
          </div>
        );
      })}
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

  useEffect(() => {
    if (user && !isEditing) {
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
    }
  }, [user, isEditing]);

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

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Préférences email</h2>
            <p className="text-sm text-gray-500">Gérez les types d'emails que vous souhaitez recevoir</p>
          </div>
        </div>
        <EmailPreferences />
      </Card>
    </div>
  );
};

export default Profile;
