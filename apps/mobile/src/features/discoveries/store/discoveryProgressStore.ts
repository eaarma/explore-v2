import { create } from "zustand";

type DiscoveryProgressState = {
  revision: number;
  markUpdated: () => void;
};

export const useDiscoveryProgressStore = create<DiscoveryProgressState>(
  (set) => ({
    revision: 0,
    markUpdated: () =>
      set((state) => ({
        revision: state.revision + 1,
      })),
  }),
);
