import { AdminActiviteDetailContent } from "./detail-content";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminActiviteDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminActiviteDetailContent activiteId={id} />;
}
