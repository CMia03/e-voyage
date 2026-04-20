"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminActiviteDetailPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      
      // Rediriger vers la page admin principale avec l'ID en paramètre
      const url = new URL("/admin", window.location.origin);
      url.searchParams.set("section", "activites-edit");
      url.searchParams.set("activiteId", id);
      
      // Garder les autres paramètres existants
      searchParams.forEach((value, key) => {
        if (key !== "section" && key !== "activiteId") {
          url.searchParams.set(key, value);
        }
      });
      
      router.replace(url.toString());
    };

    loadParams();
  }, [params, router, searchParams]);

  return <div>Redirection...</div>;
}
