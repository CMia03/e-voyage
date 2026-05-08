"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClientDestinationsRedirectPage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const username = typeof params?.username === "string" ? params.username : "client";

  useEffect(() => {
    router.replace(`/${username}`);
  }, [router, username]);

  return null;
}
