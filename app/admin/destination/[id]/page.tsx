"use client";

import { useParams, useSearchParams } from "next/navigation";
import { AdminDestinationDetailContent } from "./detail-content";

const detailSections = ["marketing", "gallery", "planning", "settings"] as const;
type DetailSection = (typeof detailSections)[number];

function resolveDetailSection(value: string | null): DetailSection {
  return detailSections.includes(value as DetailSection) ? (value as DetailSection) : "marketing";
}

export default function AdminDestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const destinationId = typeof params?.id === "string" ? params.id : "";
  const initialSection = resolveDetailSection(searchParams.get("section"));

  if (!destinationId) {
    return <div>Destination introuvable.</div>;
  }

  return <AdminDestinationDetailContent destinationId={destinationId} initialSection={initialSection} />;
}
