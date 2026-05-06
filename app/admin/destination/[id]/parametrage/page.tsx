"use client";

import { useParams } from "next/navigation";
import { AdminDestinationAssociationsContent } from "../associations/associations-content";

export default function AdminDestinationParametragePage() {
  const params = useParams<{ id: string }>();
  const destinationId = typeof params?.id === "string" ? params.id : "";

  if (!destinationId) {
    return <div>Destination introuvable.</div>;
  }

  return (
    <AdminDestinationAssociationsContent
      destinationId={destinationId}
      initialSection="hebergements"
      title="Paramétrage destination"
      description="Configurez les hébergements, activités, prestations et associations liées à cette destination."
    />
  );
}
