"use client";

import { useParams } from "next/navigation";

import { AdminDestinationAssociationsContent } from "./associations-content";

export default function AdminDestinationAssociationsPage() {
  const params = useParams<{ id: string }>();
  const destinationId = typeof params?.id === "string" ? params.id : "";

  if (!destinationId) {
    return null;
  }

  return <AdminDestinationAssociationsContent destinationId={destinationId} />;
}
