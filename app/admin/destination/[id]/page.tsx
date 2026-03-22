"use client";

import { useParams } from "next/navigation";

import { AdminDestinationDetailContent } from "./detail-content";

export default function AdminDestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const destinationId = typeof params?.id === "string" ? params.id : "";

  if (!destinationId) {
    return null;
  }

  return <AdminDestinationDetailContent destinationId={destinationId} />;
}
