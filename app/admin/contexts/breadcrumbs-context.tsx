"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  resetBreadcrumbs: () => void;
}

const defaultBreadcrumbs: BreadcrumbItem[] = [
  { label: "Admin", href: "/admin" }
];

const BreadcrumbsContext = createContext<BreadcrumbsContextType | undefined>(undefined);

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>(defaultBreadcrumbs);

  const resetBreadcrumbs = () => {
    setBreadcrumbs(defaultBreadcrumbs);
  };

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs, resetBreadcrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbsContext);
  if (context === undefined) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
  }
  return context;
}
