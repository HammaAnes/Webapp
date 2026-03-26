import { create } from 'zustand';
import type { Contact, ContactSource, ContactStatut } from '../types';
import { apiClient } from '../lib/api-client';

interface ContactFilters {
  search: string;
  statut: ContactStatut | '';
  source: ContactSource | '';
}

interface ContactState {
  contacts: Contact[];
  currentContact: Contact | null;
  loading: boolean;
  error: string | null;
  filters: ContactFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  fetchContacts: () => Promise<void>;
  fetchContactById: (id: string) => Promise<void>;
  createContact: (data: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  convertToUser: (contactId: string, sendWelcomeEmail?: boolean) => Promise<{ personId: string; temporaryPassword: string }>;
  setFilters: (filters: Partial<ContactFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  currentContact: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    statut: '',
    source: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const response = await apiClient.getContacts({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        statut: filters.statut || undefined,
        source: filters.source || undefined,
      });

      if (response.success && response.data) {
        const data = response.data as { persons?: Contact[]; contacts?: Contact[]; pagination?: typeof pagination };
        set({
          contacts: data.persons || data.contacts || [],
          pagination: data.pagination || pagination,
          loading: false,
        });
      } else {
        set({
          error: response.error || 'Erreur lors du chargement des contacts',
          loading: false,
        });
      }
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des contacts',
        loading: false,
      });
    }
  },

  fetchContactById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.getContact(id);
      if (response.success && response.data) {
        const d = response.data as { person?: Contact } | Contact;
        const contact = (d as { person?: Contact }).person ?? d as Contact;
        set({ currentContact: contact, loading: false });
      } else {
        set({
          error: response.error || 'Erreur lors du chargement du contact',
          loading: false,
        });
      }
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Erreur lors du chargement du contact',
        loading: false,
      });
    }
  },

  createContact: async (data: Partial<Contact>) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.createContact(data as Record<string, unknown>);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création du contact');
      }

      const responseData = response.data as { contact?: Contact } | Contact;
      const newContact = (responseData as { contact?: Contact })?.contact || responseData as Contact;

      if (!newContact || !newContact.id) {
        throw new Error('Réponse invalide du serveur');
      }

      set((state) => ({
        contacts: [newContact, ...state.contacts],
        loading: false,
      }));

      get().fetchContacts();
      return newContact;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création du contact';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateContact: async (id: string, data: Partial<Contact>) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.updateContact(id, data as Record<string, unknown>);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour du contact');
      }

      // Re-fetch to get the updated full object
      const showResp = await apiClient.getContact(id);
      const d = showResp.data as { person?: Contact } | Contact | null;
      const existing = get().contacts.find(c => c.id === id);
      const updatedContact = d ? ((d as { person?: Contact }).person ?? d as Contact) : existing ? { ...existing, ...data } : { id, ...data } as Contact;

      set((state) => ({
        contacts: state.contacts.map((c) => c.id === id ? updatedContact as Contact : c),
        currentContact: state.currentContact?.id === id ? updatedContact as Contact : state.currentContact,
        loading: false,
      }));

      return updatedContact as Contact;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du contact';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteContact: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.deleteContact(id);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression du contact');
      }

      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        currentContact: state.currentContact?.id === id ? null : state.currentContact,
        loading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du contact';
      set({ error: message, loading: false });
      throw error;
    }
  },

  convertToUser: async (contactId: string, sendWelcomeEmail = true) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.convertContactToUser(contactId, sendWelcomeEmail);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la conversion en utilisateur');
      }

      const data = response.data as { person_id?: string; personId?: string; temporaryPassword?: string; temporary_password?: string };

      get().fetchContacts();
      if (get().currentContact?.id === contactId) {
        get().fetchContactById(contactId);
      }

      set({ loading: false });

      return {
        personId: data.person_id || data.personId || '',
        temporaryPassword: data.temporaryPassword || data.temporary_password || '',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la conversion en utilisateur';
      set({ error: message, loading: false });
      throw error;
    }
  },

  setFilters: (newFilters: Partial<ContactFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchContacts();
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchContacts();
  },

  clearError: () => set({ error: null }),
}));
