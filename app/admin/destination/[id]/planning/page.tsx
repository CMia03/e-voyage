import { AdminDestinationPlanningContentNext } from "./planning-content-admin";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDestinationPlanningPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminDestinationPlanningContentNext destinationId={id} />;
}
