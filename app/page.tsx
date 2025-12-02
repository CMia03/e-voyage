import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { DestinationCard } from "@/components/destination-card";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { destinationsData } from "@/lib/destinations";

// Utiliser directement destinationsData

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        
        <section id="about" className="py-12 sm:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Pourquoi choisir Cool Voyage ?</h2>
              <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground px-4">
                Nous proposons des voyages organisés à Madagascar avec des tarifs abordables, 
                sans compromis sur la qualité. Notre équipe locale vous garantit une expérience 
                authentique et mémorable.
              </p>
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-lg border p-6">
                  <div className="mb-4 text-4xl">💰</div>
                  <h3 className="mb-2 font-semibold">Tarifs abordables</h3>
                  <p className="text-sm text-muted-foreground">
                    Des prix transparents et accessibles pour tous les budgets
                  </p>
                </div>
                <div className="rounded-lg border p-6">
                  <div className="mb-4 text-4xl">🏆</div>
                  <h3 className="mb-2 font-semibold">Qualité garantie</h3>
                  <p className="text-sm text-muted-foreground">
                    Hébergements sélectionnés et services de qualité
                  </p>
                </div>
                <div className="rounded-lg border p-6">
                  <div className="mb-4 text-4xl">🤝</div>
                  <h3 className="mb-2 font-semibold">Équipe locale</h3>
                  <p className="text-sm text-muted-foreground">
                    Guides expérimentés qui connaissent parfaitement Madagascar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="destinations" className="py-12 sm:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl mb-8 sm:mb-12 text-center">
              <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Nos Destinations</h2>
              <p className="text-base sm:text-lg text-muted-foreground px-4">
                Découvrez les merveilles de Madagascar avec nos séjours organisés
              </p>
            </div>
            <div className="mx-auto max-w-[95vw] xl:max-w-[1400px]">
              <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                {destinationsData.map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-6 sm:p-12 text-center">
              <h2 className="mb-4 text-2xl sm:text-3xl font-bold">Prêt à partir à l'aventure ?</h2>
              <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground px-4">
                Contactez-nous dès aujourd'hui pour organiser votre voyage de rêve à Madagascar
              </p>
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
                  <a href="#contact">Nous contacter</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8">
                  <a href="#destinations">Voir les destinations</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
