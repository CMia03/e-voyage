"use client";

import { useParams } from "next/navigation";
import { AdminDestinationAssociationsContent } from "../associations/associations-content";

export default function AdminDestinationPrestationsPage() {
  const params = useParams<{ id: string }>();
  const destinationId = typeof params?.id === "string" ? params.id : "";

  if (!destinationId) {
    return <div>Destination introuvable.</div>;
  }

  return (
    <AdminDestinationAssociationsContent
      destinationId={destinationId}
      initialSection="prestations"
      title="Prestations destination"
      description="Gérez les prestations incluses ou en sus pour cette destination."
    />
  );
}
