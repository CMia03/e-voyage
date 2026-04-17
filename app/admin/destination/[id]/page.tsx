"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AdminDestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinationId = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (!destinationId) return;
    
    // Rediriger vers la page admin principale avec l'ID en paramètre
    const url = new URL("/admin", window.location.origin);
    url.searchParams.set("section", "destinations-edit");
    url.searchParams.set("destinationId", destinationId);
    
    // Garder les autres paramètres existants
    searchParams.forEach((value, key) => {
      if (key !== "section" && key !== "destinationId") {
        url.searchParams.set(key, value);
      }
    });
    
    router.replace(url.toString());
  }, [destinationId, router, searchParams]);

  return <div>Redirection...</div>;
}
