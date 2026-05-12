"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ExtraActionsContextType {
  extraActions: ReactNode;
  setExtraActions: (actions: ReactNode | null) => void;
  clearExtraActions: () => void;
}

const ExtraActionsContext = createContext<ExtraActionsContextType | undefined>(undefined);

export function ExtraActionsProvider({ children }: { children: ReactNode }) {
  const [extraActions, setExtraActions] = useState<ReactNode>(null);

  const clearExtraActions = useCallback(() => {
    setExtraActions(null);
  }, []);

  return (
    <ExtraActionsContext.Provider value={{ extraActions, setExtraActions, clearExtraActions }}>
      {children}
    </ExtraActionsContext.Provider>
  );
}

export function useExtraActions() {
  const context = useContext(ExtraActionsContext);
  if (!context) {
    throw new Error("useExtraActions must be used within an ExtraActionsProvider");
  }
  return context;
}
