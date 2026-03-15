import { useState, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';
import { fromAPI, documentFromAPI, courrierFromAPI } from '../adapters/apiAdapter';
import { validatePostCreation } from '../domain/validators';
import { toAPI } from '../adapters/apiAdapter';
import type {
  DemandeDomiciliation,
  WizardFormData,
  UploadedDocument,
  DocumentRecord,
  CourrierItem,
  ActionKey,
  ActionData,
  TypeStructure,
} from '../domain/types';
import { getCasMetier } from '../domain/types';

export function useDomiciliation(userId: string) {
  const [demande, setDemande] = useState<DemandeDomiciliation | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDemande = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDomiciliations();
      if (!res.success) {
        setError(res.error || 'Erreur de chargement');
        return;
      }
      const list = (Array.isArray(res.data) ? res.data : (res.data as Record<string, unknown>)?.data ?? []) as Record<string, unknown>[];
      const userDemande = list.find(
        d => String(d.user_id) === userId &&
        !['refusee', 'resiliee', 'expiree'].includes(String(d.statut))
      ) ?? list.find(d => String(d.user_id) === userId);
      setDemande(userDemande ? fromAPI(userDemande) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const submitNewDemande = useCallback(async (
    formData: WizardFormData,
    uploadedDocuments: UploadedDocument[]
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!formData.situation || !formData.typeStructure) {
      return { success: false, error: 'Données incomplètes' };
    }
    const cas = getCasMetier(formData.situation, formData.typeStructure);
    const entreprise = formData.entreprise as Record<string, unknown> | null;

    const payload: Record<string, unknown> = {
      situation_administrative: formData.situation,
      type_structure: formData.typeStructure,
      cgu_acceptees: formData.cguAcceptees,
      options: JSON.stringify(formData.options),
      date_debut_souhaitee: formData.dateDebutSouhaitee
        ? formData.dateDebutSouhaitee.toISOString().split('T')[0]
        : null,
      representant_nom: formData.dirigeant.nom,
      representant_prenom: formData.dirigeant.prenom,
      representant_telephone: formData.dirigeant.telephone,
      representant_email: formData.dirigeant.email,
      representant_adresse_residence: formData.dirigeant.adresseResidence,
      representant_ville: formData.dirigeant.ville,
      representant_fonction: formData.dirigeant.fonction || '',
    };

    if (cas === 'A1' && entreprise) {
      payload.raison_sociale = entreprise.denominationSociale;
      payload.forme_juridique = entreprise.formeJuridique;
      payload.code_nae = entreprise.codeNae;
    } else if (cas === 'A2' && entreprise) {
      payload.activite_exercee = entreprise.activiteExercee;
      payload.description_activite = entreprise.descriptionActivite;
    } else if (cas === 'B1' && entreprise) {
      payload.raison_sociale = entreprise.denominationSociale;
      payload.forme_juridique = entreprise.formeJuridique;
      payload.registre_commerce = entreprise.registreCommerce;
      payload.nif = entreprise.nif;
      payload.nis = entreprise.nis;
      payload.article_imposition = entreprise.articleImposition;
      payload.code_nae = entreprise.codeNae;
      if (entreprise.dateCreationEntreprise instanceof Date) {
        payload.date_creation_entreprise = entreprise.dateCreationEntreprise.toISOString().split('T')[0];
      }
      payload.ville_immatriculation = entreprise.villeImmatriculation;
    } else if (cas === 'B2' && entreprise) {
      payload.numero_auto_entrepreneur = entreprise.numeroAutoEntrepreneur;
      payload.activite_exercee = entreprise.activiteExercee;
      if (entreprise.dateInscriptionAutoEntrepreneur instanceof Date) {
        payload.date_inscription_auto_entrepreneur = (entreprise.dateInscriptionAutoEntrepreneur as Date).toISOString().split('T')[0];
      }
    }

    try {
      const res = await apiClient.createDemandeDomiciliation(payload);
      if (!res.success) return { success: false, error: res.error };

      const newId = (res.data as Record<string, unknown>)?.id as string | undefined;
      if (newId && uploadedDocuments.length > 0) {
        await Promise.allSettled(
          uploadedDocuments.map(doc =>
            apiClient.uploadDocument(doc.file, 'domiciliation', newId, doc.type)
          )
        );
      }

      await loadDemande();
      return { success: true, id: newId };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' };
    }
  }, [loadDemande]);

  const submitPostCreation = useCallback(async (
    typeStructure: TypeStructure,
    data: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    const validation = validatePostCreation(typeStructure, data);
    if (!validation.valid) {
      const firstKey = Object.keys(validation.errors)[0];
      return { success: false, error: validation.errors[firstKey] };
    }
    if (!demande) return { success: false, error: 'Demande introuvable' };
    try {
      const res = await apiClient.updateDemandeDomiciliation(demande.id, data);
      if (!res.success) return { success: false, error: res.error };
      await loadDemande();
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' };
    }
  }, [demande, loadDemande]);

  const performAction = useCallback(async (
    id: string,
    action: ActionKey,
    data?: ActionData
  ): Promise<{ success: boolean; error?: string }> => {
    setActionLoading(true);
    try {
      let res;
      switch (action) {
        case 'valider':
          res = await apiClient.validateDomiciliation(id);
          break;
        case 'rejeter':
          res = await apiClient.rejectDomiciliation(id, data?.motif || '');
          break;
        case 'complements':
          res = await apiClient.updateDemandeDomiciliation(id, {
            statut: 'en_attente_complements',
            commentaire_admin: data?.motif || '',
          });
          break;
        case 'signer':
          res = await apiClient.updateDemandeDomiciliation(id, {
            statut: 'domiciliation_creee',
            numero_bureau: data?.numeroBureau,
            reference_contrat_notarie: data?.referenceContratNotarie,
            date_debut_contrat: data?.dateDebutContrat,
            date_fin_contrat: data?.dateFinContrat,
            montant_mensuel: data?.montantMensuel,
          });
          break;
        case 'activer':
          res = await apiClient.activateDomiciliation(id, {
            montantMensuel: data?.montantMensuel ?? 12000,
            dateDebut: data?.dateDebutContrat ?? '',
            dateFin: data?.dateFinContrat ?? '',
            numeroBureau: data?.numeroBureau,
          });
          break;
        case 'renouveler':
          res = await apiClient.updateDemandeDomiciliation(id, {
            statut: 'active',
            date_debut_contrat: data?.dateDebutContrat,
            date_fin_contrat: data?.dateFinContrat,
            montant_mensuel: data?.montantMensuel,
          });
          break;
        case 'resilier':
          res = await apiClient.updateDemandeDomiciliation(id, {
            statut: 'resiliee',
            commentaire_admin: data?.motif || '',
          });
          break;
        default:
          return { success: false, error: 'Action inconnue' };
      }
      if (!res.success) return { success: false, error: res.error };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' };
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    demande,
    loading,
    actionLoading,
    error,
    loadDemande,
    submitNewDemande,
    submitPostCreation,
    performAction,
    toAPI,
  };
}

export function useOccupiedBureaux(excludeId?: string) {
  const [occupied, setOccupied] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getDomiciliations();
      if (res.success && res.data) {
        const all = (
          Array.isArray(res.data) ? res.data : ((res.data as Record<string, unknown>).data as unknown[]) || []
        ) as Record<string, unknown>[];
        const STATUTS_ACTIFS = ['active', 'domiciliation_creee', 'en_attente_complements', 'en_attente_signature'];
        const nums = all
          .filter(d => STATUTS_ACTIFS.includes(String(d.statut)) && d.numero_bureau && (!excludeId || String(d.id) !== excludeId))
          .map(d => Number(d.numero_bureau));
        setOccupied(nums);
      }
    } catch {
      setOccupied([]);
    }
  }, [excludeId]);

  return { occupied, load };
}

export function useCourrier(domiciliationId: string) {
  const [courriers, setCourriers] = useState<CourrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiClient.getUserCourrier(domiciliationId);
      const data = r.data as Record<string, unknown> | unknown[] | undefined;
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(data)) raw = data as Record<string, unknown>[];
      else if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        raw = (Array.isArray(d.courriers) ? d.courriers : []) as Record<string, unknown>[];
      }
      setCourriers(raw.map(courrierFromAPI));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
      setCourriers([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  return { courriers, loading, error, reload: load };
}

export function useDocuments(domiciliationId: string) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getDocuments('domiciliation', domiciliationId);
      const data = response.data;
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray(data)) raw = data as Record<string, unknown>[];
      else if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        raw = (Array.isArray(d.documents) ? d.documents : []) as Record<string, unknown>[];
      }
      setDocs(raw.map(documentFromAPI));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [domiciliationId]);

  return { docs, loading, error, reload: load };
}
