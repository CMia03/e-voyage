"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { AdminDestinationDetailContent } from "./detail-content";
import { useBreadcrumbs } from "../../contexts/breadcrumbs-context";

export default function AdminDestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const destinationId = typeof params?.id === "string" ? params.id : "";
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Destinations", href: "/admin?section=destinations" },
      { label: "Détail destination", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  if (!destinationId) {
    return null;
  }

  return <AdminDestinationDetailContent destinationId={destinationId} />;
}
