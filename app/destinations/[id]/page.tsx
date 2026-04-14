import { Header } from "@/components/header";
import { FooterDynamic } from "@/components/footer-dynamic";
import { DestinationDetailsComponent } from "@/components/destination-details";
import { getDestinationDetailsFromBackend } from "@/lib/api/destinations";
import { getDestinationById as getFallbackDestinationById } from "@/lib/destinations";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let destination = null;
  let hasData = true;

  try {
    const response = await getDestinationDetailsFromBackend(id);
    if (response.success && response.data) {
      destination = response.data;
    } else {
      hasData = false;
    }
  } catch {
    // Essayer avec les données locales en fallback
    destination = getFallbackDestinationById(id) ?? null;
    if (!destination) {
      hasData = false;
    }
  }

  if (!destination && hasData) {
    notFound();
  }

  if (!hasData) {
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
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">Aucune donnée</h2>
                <p className="text-muted-foreground mb-8">
                  Les détails de cette destination ne sont pas disponibles dans la base de données.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/#destinations">Retour aux destinations</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <FooterDynamic />
      </div>
    );
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
        {destination && <DestinationDetailsComponent destination={destination} />}
      </main>
      <FooterDynamic />
    </div>
  );
}

