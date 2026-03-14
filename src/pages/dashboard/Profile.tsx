import React, { useState, useRef } from "react";
import { User, Mail, Phone, Building, FileEdit as Edit2, Save, X, CreditCard, Upload, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { apiClient } from "../../lib/api-client";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, loadUser } = useAuthStore();
  const { updateUser } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [idUploading, setIdUploading] = useState(false);
  const idFileInputRef = useRef<HTMLInputElement>(null);
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
      toast.success("Profil mis a jour");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erreur lors de la mise a jour");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performUpdate();
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG ou PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo).");
      return;
    }
    setIdUploading(true);
    try {
      const res = await apiClient.uploadDocument(file, "user", user.id, "carte_identite");
      if (res.success && res.data?.chemin_fichier) {
        await apiClient.put(`/users/update.php?id=${user.id}`, {
          carteIdentiteUrl: res.data.chemin_fichier,
        });
        await loadUser();
        toast.success("Carte d'identité enregistrée !");
      } else {
        toast.error((res as { error?: string }).error || "Erreur lors de l'upload.");
      }
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setIdUploading(false);
      if (idFileInputRef.current) idFileInputRef.current.value = "";
    }
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
              onChange={(e) =>
                setFormData({ ...formData, prenom: e.target.value })
              }
              disabled={!isEditing}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Nom"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              disabled={!isEditing}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!isEditing}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Téléphone"
              value={formData.telephone}
              onChange={(e) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              disabled={!isEditing}
              icon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="Entreprise"
              value={formData.entreprise}
              onChange={(e) =>
                setFormData({ ...formData, entreprise: e.target.value })
              }
              disabled={!isEditing}
              icon={<Building className="w-4 h-4" />}
            />
            <Input
              label="Profession"
              value={formData.profession}
              onChange={(e) =>
                setFormData({ ...formData, profession: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <Input
            label="Adresse"
            value={formData.adresse}
            onChange={(e) =>
              setFormData({ ...formData, adresse: e.target.value })
            }
            disabled={!isEditing}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
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
        <div className="flex items-center justify-between mb-4">
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

        <input
          ref={idFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleIdUpload}
          className="hidden"
        />

        {user.carteIdentiteUrl ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="w-4 h-4 text-gray-400" />
              Document archivé
            </div>
            <button
              onClick={() => idFileInputRef.current?.click()}
              disabled={idUploading}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors disabled:opacity-50"
            >
              {idUploading ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mise à jour…</span>
              ) : "Remplacer"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => idFileInputRef.current?.click()}
            disabled={idUploading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-sky-400 hover:bg-sky-50 text-gray-600 hover:text-sky-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {idUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement en cours…
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Télécharger ma carte d'identité (JPG, PNG ou PDF — max 5 Mo)
              </>
            )}
          </button>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Vos documents sont stockés de façon sécurisée et ne sont utilisés qu'à des fins de vérification d'identité.
        </p>
      </Card>
    </div>
  );
};

export default Profile;
