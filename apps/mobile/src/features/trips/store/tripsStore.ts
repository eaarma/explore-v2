import { create } from "zustand";

type TripsState = {
  revision: number;
  markUpdated: () => void;
};

export const useTripsStore = create<TripsState>((set) => ({
  revision: 0,
  markUpdated: () =>
    set((state) => ({
      revision: state.revision + 1,
    })),
}));
