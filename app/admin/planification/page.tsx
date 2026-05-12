"use client";

import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { useAdminNavigation } from "../contexts/admin-navigation-context";
import { useExtraActions } from "../contexts/extra-actions-context";
import { AdminPlanificationCalendar } from "./components/admin-planification-calendar";

export default function PlanificationPage() {
  const { session } = useAuth();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { setActive } = useAdminNavigation();
  const { clearExtraActions } = useExtraActions();

  useEffect(() => {
    // Synchroniser la section active avec la navigation admin
    setActive("planification");
  }, [setActive]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Planification", isActive: true },
    ]);
  }, [setBreadcrumbs]);

  // Nettoyer les actions supplémentaires quand on arrive sur cette page
  useEffect(() => {
    clearExtraActions();
  }, []);

  return <AdminPlanificationCalendar accessToken={session?.accessToken ?? ""} />;
}
