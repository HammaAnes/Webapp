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
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.source) params.append('source', filters.source);

      const response = await apiClient.get(`/contacts/?${params.toString()}`);

      set({
        contacts: response.contacts || [],
        pagination: response.pagination || pagination,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors du chargement des contacts',
        loading: false,
      });
    }
  },

  fetchContactById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const contact = await apiClient.get(`/contacts/show.php?id=${id}`);
      set({ currentContact: contact, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors du chargement du contact',
        loading: false,
      });
    }
  },

  createContact: async (data: Partial<Contact>) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/contacts/create.php', data);
      const newContact = response.contact;

      set((state) => ({
        contacts: [newContact, ...state.contacts],
        loading: false,
      }));

      get().fetchContacts();

      return newContact;
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors de la création du contact',
        loading: false,
      });
      throw error;
    }
  },

  updateContact: async (id: string, data: Partial<Contact>) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put('/contacts/update.php', { ...data, id });
      const updatedContact = response.contact;

      set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === id ? updatedContact : c
        ),
        currentContact: state.currentContact?.id === id ? updatedContact : state.currentContact,
        loading: false,
      }));

      return updatedContact;
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors de la mise à jour du contact',
        loading: false,
      });
      throw error;
    }
  },

  deleteContact: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/contacts/delete.php?id=${id}`);

      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        currentContact: state.currentContact?.id === id ? null : state.currentContact,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors de la suppression du contact',
        loading: false,
      });
      throw error;
    }
  },

  convertToUser: async (contactId: string, sendWelcomeEmail = true) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/contacts/convert-to-user.php', {
        contactId,
        sendWelcomeEmail,
      });

      get().fetchContacts();
      if (get().currentContact?.id === contactId) {
        get().fetchContactById(contactId);
      }

      set({ loading: false });

      return {
        userId: response.userId,
        temporaryPassword: response.temporaryPassword,
      };
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors de la conversion en utilisateur',
        loading: false,
      });
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
