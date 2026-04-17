"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminHebergementDetailContentNext } from "./detail-content-next";

export default function AdminHebergementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      
      // Rediriger vers la page admin principale avec l'ID en paramètre
      const url = new URL("/admin", window.location.origin);
      url.searchParams.set("section", "hebergements-edit");
      url.searchParams.set("id", id);
      
      // Garder les autres paramètres existants
      searchParams.forEach((value, key) => {
        if (key !== "section" && key !== "id") {
          url.searchParams.set(key, value);
        }
      });
      
      router.replace(url.toString());
    };

    loadParams();
  }, [params, router, searchParams]);

  return <div>Redirection...</div>;
}
