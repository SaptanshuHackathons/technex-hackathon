import { create } from "zustand";

export type User = {
  name: string;
  email: string;
  image?: string;
  tier: "Free" | "Pro" | "Enterprise";
};

export type UserStore = {
  user: User | null;
  logout: () => void;
  setUser: (user: User) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: {
    name: "Demo User",
    email: "demo@example.com",
    image: "",
    tier: "Pro",
  },
  logout: () => set({ user: null }),
  setUser: (user) => set({ user }),
}));
