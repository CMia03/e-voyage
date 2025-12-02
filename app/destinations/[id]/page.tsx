import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DestinationDetailsComponent } from "@/components/destination-details";
import { getDestinationById } from "@/lib/destinations";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function generateStaticParams() {
  return [
    { id: "manambato" },
    { id: "ambila-lemaintso" },
    { id: "sainte-marie" },
    { id: "le-grand-sud" },
  ];
}

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = getDestinationById(id);

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
      <Footer />
    </div>
  );
}

