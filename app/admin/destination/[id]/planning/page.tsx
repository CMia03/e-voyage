import { AdminDestinationPlanningContent } from "./planning-content";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDestinationPlanningPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminDestinationPlanningContent destinationId={id} />;
}
