"use client";

import { useEffect, useState } from "react";
import { AdminActiviteDetailContent } from "./detail-content";
import { useBreadcrumbs } from "../../contexts/breadcrumbs-context";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminActiviteDetailPage({ params }: PageProps) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [activiteId, setActiviteId] = useState<string>("");

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      setActiviteId(id);
      
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
        { label: "Activités", href: "/admin?section=activites" },
        { label: "Détail activité", isActive: true }
      ]);
    };

    loadParams();
  }, [params, setBreadcrumbs]);

  if (!activiteId) {
    return <div>Chargement...</div>;
  }

  return <AdminActiviteDetailContent activiteId={activiteId} />;
}
