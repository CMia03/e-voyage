"use client";

import { useEffect, useState } from "react";
import { AdminHebergementDetailContentNext } from "./detail-content-next";
import { useBreadcrumbs } from "../../contexts/breadcrumbs-context";

export default function AdminHebergementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [hebergementId, setHebergementId] = useState<string>("");

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      setHebergementId(id);
      
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
        { label: "Hébergements", href: "/admin?section=hebergements" },
        { label: "Détail hébergement", isActive: true }
      ]);
    };

    loadParams();
  }, [params, setBreadcrumbs]);

  if (!hebergementId) {
    return <div>Chargement...</div>;
  }

  return <AdminHebergementDetailContentNext hebergementId={hebergementId} />;
}
