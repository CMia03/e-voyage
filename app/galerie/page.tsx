import { Header } from "@/components/header";
import { FooterDynamic } from "@/components/footer-dynamic";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GalleryClient } from "@/components/gallery-client";

export default async function GaleriePage() {
  let destinationsData = fallbackDestinations;

  try {
    const apiDestinations = await listDestinations();
    if (apiDestinations.length > 0) {
      destinationsData = apiDestinations;
    }
  } catch {
    destinationsData = fallbackDestinations;
  }

  // Récupérer toutes les images de toutes les destinations
  const allImages = destinationsData.flatMap(dest => 
    (dest.galleryAll?.length ? dest.galleryAll : dest.gallery).map(img => ({
      src: img,
      destination: dest.title,
      destinationId: dest.id
    }))
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero section avec gradient */}
        <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border-b">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
          <div className="container mx-auto px-4 py-8 sm:py-12 relative z-10">
            <Button variant="ghost" asChild className="mb-6 hover:bg-white/50 dark:hover:bg-white/10">
              <Link href="/" className="flex items-center gap-2">
                <span>←</span>
                <span>Retour à l'accueil</span>
              </Link>
            </Button>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Galerie Photos
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                Découvrez toutes les images de nos destinations à Madagascar
              </p>
            </div>
          </div>
        </div>
        
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.03),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-7xl">
              <GalleryClient images={allImages} />
            </div>
          </div>
        </section>
      </main>
      <FooterDynamic />
    </div>
  );
}

