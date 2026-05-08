"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function ClientPlanificationsRedirectPage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = typeof params?.username === "string" ? params.username : "client";
  const destinationId = searchParams.get("destinationId");

  useEffect(() => {
    router.replace(destinationId ? `/destinations/${encodeURIComponent(destinationId)}` : `/${username}`);
  }, [destinationId, router, username]);

  return null;
}
