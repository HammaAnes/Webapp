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
  convertToUser: (contactId: string, sendWelcomeEmail?: boolean) => Promise<{ userId: string; temporaryPassword: string }>;
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
        const data = response.data as { contacts?: Contact[]; pagination?: typeof pagination };
        set({
          contacts: data.contacts || [],
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
        set({ currentContact: response.data as Contact, loading: false });
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

      const responseData = response.data as { contact?: Contact } | Contact;
      const updatedContact = (responseData as { contact?: Contact })?.contact || responseData as Contact;

      set((state) => ({
        contacts: state.contacts.map((c) => c.id === id ? updatedContact : c),
        currentContact: state.currentContact?.id === id ? updatedContact : state.currentContact,
        loading: false,
      }));

      return updatedContact;
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

      const data = response.data as { userId?: string; user_id?: string; temporaryPassword?: string; temporary_password?: string };

      get().fetchContacts();
      if (get().currentContact?.id === contactId) {
        get().fetchContactById(contactId);
      }

      set({ loading: false });

      return {
        userId: data.userId || data.user_id || '',
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
