import { useState, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';
import { fromAPI } from '../adapters/apiAdapter';
import type { DemandeDomiciliation, WizardFormData, UploadedDocument, TypeStructure, DonneesA1, DonneesA2, DonneesB1, DonneesB2 } from '../domain/types';
import { getCasMetier } from '../domain/types';
import { validatePostCreation } from '../domain/validators';
import { calculateMonthlyTotal } from '../domain/pricing';
import { format } from 'date-fns';

export function useDomiciliation(userId: string) {
  const [demande, setDemande] = useState<DemandeDomiciliation | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDemande = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request<Record<string, unknown>>(
        `/domiciliations/user.php?user_id=${userId}`
      );
      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>;
        const d = (raw.domiciliation ?? raw) as Record<string, unknown>;
        if (d && d.id) {
          setDemande(fromAPI(d));
        } else {
          setDemande(null);
        }
      } else {
        setDemande(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
      setDemande(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const submitNewDemande = useCallback(
    async (formData: WizardFormData, documents: UploadedDocument[]): Promise<void> => {
      if (!formData.situation || !formData.typeStructure) {
        throw new Error('Situation et type de structure requis');
      }

      setActionLoading(true);
      try {
        const cas = getCasMetier(formData.situation, formData.typeStructure);
        const payload: Record<string, unknown> = {
          situation_administrative: formData.situation,
          type_structure: formData.typeStructure,
          representant_nom: formData.dirigeant.nom,
          representant_prenom: formData.dirigeant.prenom,
          representant_telephone: formData.dirigeant.telephone,
          representant_email: formData.dirigeant.email,
          representant_adresse_residence: formData.dirigeant.adresseResidence,
          representant_ville: formData.dirigeant.ville,
          cgu_acceptees: formData.cguAcceptees ? 1 : 0,
          options: JSON.stringify(formData.options),
          montant_mensuel: calculateMonthlyTotal(formData.options),
        };

        if (formData.dateDebutSouhaitee) {
          payload.date_debut_souhaitee = format(formData.dateDebutSouhaitee, 'yyyy-MM-dd');
        }

        if (cas === 'A1') {
          const e = formData.entreprise as DonneesA1;
          payload.raison_sociale = e.denominationSociale;
          payload.forme_juridique = e.formeJuridique;
          payload.code_nae = e.codeNae;
        } else if (cas === 'A2') {
          const e = formData.entreprise as DonneesA2;
          payload.activite_exercee = e.activiteExercee;
          payload.description_activite = e.descriptionActivite;
        } else if (cas === 'B1') {
          const e = formData.entreprise as DonneesB1;
          payload.raison_sociale = e.denominationSociale;
          payload.forme_juridique = e.formeJuridique;
          payload.registre_commerce = e.registreCommerce;
          payload.nif = e.nif;
          payload.nis = e.nis;
          payload.article_imposition = e.articleImposition;
          payload.code_nae = e.codeNae;
          payload.ville_immatriculation = e.villeImmatriculation;
          if (e.dateCreationEntreprise) {
            payload.date_creation_entreprise = format(e.dateCreationEntreprise, 'yyyy-MM-dd');
          }
        } else if (cas === 'B2') {
          const e = formData.entreprise as DonneesB2;
          payload.numero_auto_entrepreneur = e.numeroAutoEntrepreneur;
          payload.activite_exercee = e.activiteExercee;
          if (e.dateInscriptionAutoEntrepreneur) {
            payload.date_inscription_auto_entrepreneur = format(
              e.dateInscriptionAutoEntrepreneur,
              'yyyy-MM-dd'
            );
          }
        }

        const res = await apiClient.request<Record<string, unknown>>(
          '/domiciliations/create.php',
          { method: 'POST', body: JSON.stringify(payload) }
        );
        if (!res.success) {
          throw new Error(
            (res as Record<string, unknown>).message as string ||
            (res as Record<string, unknown>).error as string ||
            'Erreur lors de la création'
          );
        }

        const domId = (res.data as Record<string, unknown>)?.id as string;

        if (domId && documents.length > 0) {
          await Promise.all(
            documents.map(async (doc) => {
              try {
                await apiClient.uploadDocument(doc.file, 'domiciliation', domId, doc.type);
              } catch {
              }
            })
          );
        }

        await loadDemande();
      } finally {
        setActionLoading(false);
      }
    },
    [loadDemande]
  );

  const submitPostCreation = useCallback(
    async (typeStructure: TypeStructure, data: Record<string, string>): Promise<void> => {
      const validation = validatePostCreation(typeStructure, data);
      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      if (!demande?.id) throw new Error('Aucune demande en cours');

      setActionLoading(true);
      try {
        const payload: Record<string, string> = {};
        if (typeStructure === 'societe') {
          if (data.nif) payload.nif = data.nif;
          if (data.nis) payload.nis = data.nis;
          if (data.registreCommerce) payload.registre_commerce = data.registreCommerce;
          if (data.articleImposition) payload.article_imposition = data.articleImposition;
        } else {
          if (data.numeroAutoEntrepreneur) payload.numero_auto_entrepreneur = data.numeroAutoEntrepreneur;
        }

        const res = await apiClient.updateDemandeDomiciliation(demande.id, payload);
        if (!res.success) throw new Error((res as Record<string, unknown>).message as string || 'Erreur lors de la mise à jour');
        await loadDemande();
      } finally {
        setActionLoading(false);
      }
    },
    [demande, loadDemande]
  );

  const requestRenewal = useCallback(async (): Promise<void> => {
    if (!demande?.id) return;
    setActionLoading(true);
    try {
      const res = await apiClient.updateDemandeDomiciliation(demande.id, {
        commentaire_admin: `[RENOUVELLEMENT] Demande soumise le ${new Date().toLocaleDateString('fr-FR')}.`,
      });
      if (!res.success) throw new Error((res as Record<string, unknown>).message as string || 'Erreur');
      await loadDemande();
    } finally {
      setActionLoading(false);
    }
  }, [demande, loadDemande]);

  return {
    demande,
    loading,
    actionLoading,
    error,
    loadDemande,
    submitNewDemande,
    submitPostCreation,
    requestRenewal,
  };
}
