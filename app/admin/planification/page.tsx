"use client";

import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { AdminPlanificationCalendar } from "./components/admin-planification-calendar";

export default function PlanificationPage() {
  const { session } = useAuth();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Planification", isActive: true },
    ]);
  }, [setBreadcrumbs]);

  return <AdminPlanificationCalendar accessToken={session?.accessToken ?? ""} />;
}
