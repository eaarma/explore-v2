import { create } from "zustand";

type ContentSyncState = {
  revision: number;
  markUpdated: () => void;
};

export const useContentSyncStore = create<ContentSyncState>((set) => ({
  revision: 0,
  markUpdated: () =>
    set((state) => ({
      revision: state.revision + 1,
    })),
}));
