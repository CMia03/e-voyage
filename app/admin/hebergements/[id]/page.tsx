import { AdminHebergementDetailContentNext } from "./detail-content-next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminHebergementDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminHebergementDetailContentNext hebergementId={id} />;
}
