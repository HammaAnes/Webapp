import React, { useState } from "react";
import { User, Mail, Phone, Building, Edit2, Save, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/store";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";

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
    </div>
  );
};

export default Profile;
