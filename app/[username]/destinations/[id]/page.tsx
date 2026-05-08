"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClientDestinationDetailRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const destinationId = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    router.replace(destinationId ? `/destinations/${encodeURIComponent(destinationId)}` : "/");
  }, [destinationId, router]);

  return null;
}
