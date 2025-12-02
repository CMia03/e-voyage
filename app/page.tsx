import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { DestinationCard } from "@/components/destination-card";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { destinationsData } from "@/lib/destinations";
import { SmoothScrollButtons } from "@/components/smooth-scroll-buttons";
import { HomeGallery } from "@/components/home-gallery";

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

        <section id="qui-sommes-nous" className="py-12 sm:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 sm:mb-12 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Qui sommes nous ?</h2>
              </div>
              
              <div className="rounded-lg border bg-background p-6 sm:p-8 md:p-10">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed">
                    Chez Cool Voyage, tout est soigneusement préparé pour vous accueillir dans les meilleures conditions. Une équipe compétente et une organisation rigoureuse vous attendent, avec tout le nécessaire pour votre confort, y compris une restauration adaptée à tous.
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="mb-4 text-xl sm:text-2xl font-semibold text-center">Nos Services</h3>
                    <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed">
                      <strong>Cool Voyage</strong> peut organiser des <strong>voyages privés</strong>, 
                      <strong> entre amis</strong>, selon <strong>votre budget</strong>. 
                      Que vous soyez en groupe ou en solo, nous adaptons nos offres à vos besoins !
                    </p>
                  </div>
                  
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 mt-8">
                    <div className="text-center p-4 rounded-lg bg-primary/5">
                      <div className="text-3xl mb-2">👥</div>
                      <p className="text-sm font-medium">Voyages privés</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/5">
                      <div className="text-3xl mb-2">👫</div>
                      <p className="text-sm font-medium">Entre amis</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/5">
                      <div className="text-3xl mb-2">💰</div>
                      <p className="text-sm font-medium">Selon votre budget</p>
                    </div>
                  </div>
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

        <section id="gallery" className="py-12 sm:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 sm:mb-12 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Galerie Photos</h2>
                <p className="text-base sm:text-lg text-muted-foreground px-4">
                  Découvrez un aperçu de nos destinations à Madagascar
                </p>
              </div>
              <HomeGallery />
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-6 sm:p-12 text-center">
              <h2 className="mb-4 text-2xl sm:text-3xl font-bold">Prêt à partir à l'aventure ?</h2>
              <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground px-4">
                Contactez-nous dès aujourd'hui pour organiser votre voyage de rêve à Madagascar
              </p>
              <SmoothScrollButtons />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
