import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "../types";

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;

  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  removeUser: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  users: [],
  loading: false,
  error: null,
};

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUsers: (users) => set({ users, error: null }),

      addUser: (user) => set((state) => ({
        users: [...state.users, user],
        error: null,
      })),

      updateUser: (id, data) => set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? { ...user, ...data } : user
        ),
        error: null,
      })),

      removeUser: (id) => set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        error: null,
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: "UserStore" }
  )
);
