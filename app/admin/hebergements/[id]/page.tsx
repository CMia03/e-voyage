import { AdminHebergementDetailContentNext } from "./detail-content-next";

export default async function AdminHebergementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminHebergementDetailContentNext hebergementId={id} />;
}
