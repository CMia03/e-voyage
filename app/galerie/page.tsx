import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ImageLightbox } from "@/components/image-lightbox";
import { destinationsData } from "@/lib/destinations";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { GalleryClient } from "@/components/gallery-client";

export default function GaleriePage() {
  // Récupérer toutes les images de toutes les destinations
  const allImages = destinationsData.flatMap(dest => 
    dest.gallery.map(img => ({
      src: img,
      destination: dest.title,
      destinationId: dest.id
    }))
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-background">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" asChild>
              <Link href="/">← Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
        
        <section className="py-12 sm:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 sm:mb-12 text-center">
                <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-bold">Galerie Photos</h1>
                <p className="text-base sm:text-lg text-muted-foreground px-4">
                  Découvrez toutes les images de nos destinations à Madagascar
                </p>
              </div>

              <GalleryClient images={allImages} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

