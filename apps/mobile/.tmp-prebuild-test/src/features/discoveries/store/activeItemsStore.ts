import { create } from "zustand";

type ActiveItemsState = {
  revision: number;
  markUpdated: () => void;
};

export const useActiveItemsStore = create<ActiveItemsState>((set) => ({
  revision: 0,
  markUpdated: () =>
    set((state) => ({
      revision: state.revision + 1,
    })),
}));
