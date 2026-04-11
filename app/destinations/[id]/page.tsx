import { Header } from "@/components/header";
import { FooterDynamic } from "@/components/footer-dynamic";
import { DestinationDetailsComponent } from "@/components/destination-details";
import { getDestinationById } from "@/lib/api/destinations";
import { getDestinationById as getFallbackDestinationById } from "@/lib/destinations";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let destination = null;

  try {
    destination = await getDestinationById(id);
  } catch {
    destination = getFallbackDestinationById(id) ?? null;
  }

  if (!destination) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-background">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" asChild>
              <Link href="/#destinations">← Retour aux destinations</Link>
            </Button>
          </div>
        </div>
        <DestinationDetailsComponent destination={destination} />
      </main>
      <FooterDynamic />
    </div>
  );
}

