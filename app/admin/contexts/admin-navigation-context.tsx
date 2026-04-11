"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AdminSection } from "../components/sidebar";

interface AdminNavigationContextType {
  active: AdminSection;
  setActive: (section: AdminSection) => void;
}

const AdminNavigationContext = createContext<AdminNavigationContextType | undefined>(undefined);

export function AdminNavigationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<AdminSection>("dashboard");

  return (
    <AdminNavigationContext.Provider value={{ active, setActive }}>
      {children}
    </AdminNavigationContext.Provider>
  );
}

export function useAdminNavigation() {
  const context = useContext(AdminNavigationContext);
  if (context === undefined) {
    throw new Error("useAdminNavigation must be used within an AdminNavigationProvider");
  }
  return context;
}
