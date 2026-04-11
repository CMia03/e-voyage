import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { DestinationCard } from "@/components/destination-card";
import { FooterDynamic } from "@/components/footer-dynamic";
import { SmoothScrollButtons } from "@/components/smooth-scroll-buttons";
import { HomeGallery } from "@/components/home-gallery";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";

export default async function Home() {
  let destinationsData = fallbackDestinations;

  try {
    const apiDestinations = await listDestinations();
    if (apiDestinations.length > 0) {
      destinationsData = apiDestinations;
    }
  } catch {
    destinationsData = fallbackDestinations;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        
        <section id="about" className="py-16 sm:py-24 bg-gradient-to-b from-background via-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl text-center">
              <div className="mb-12 sm:mb-16">
                <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Pourquoi choisir Cool Voyage ?
                </h2>
                <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Nous proposons des voyages organisés à Madagascar avec des tarifs abordables, 
                  sans compromis sur la qualité. Notre équipe locale vous garantit une expérience 
                  authentique et mémorable.
                </p>
              </div>
              <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
                <div className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/30">
                  <div className="mb-6 text-5xl transform transition-transform duration-300 group-hover:scale-110">💰</div>
                  <h3 className="mb-3 text-xl font-semibold">Tarifs abordables</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Des prix transparents et accessibles pour tous les budgets
                  </p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300 pointer-events-none" />
                </div>
                <div className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1 hover:border-teal-500/30">
                  <div className="mb-6 text-5xl transform transition-transform duration-300 group-hover:scale-110">🏆</div>
                  <h3 className="mb-3 text-xl font-semibold">Qualité garantie</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hébergements sélectionnés et services de qualité
                  </p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />
                </div>
                <div className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 hover:border-cyan-500/30 sm:col-span-2 md:col-span-1">
                  <div className="mb-6 text-5xl transform transition-transform duration-300 group-hover:scale-110">🤝</div>
                  <h3 className="mb-3 text-xl font-semibold">Équipe locale</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Guides expérimentés qui connaissent parfaitement Madagascar
                  </p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/5 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="qui-sommes-nous" className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 sm:mb-16 text-center">
                <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Qui sommes nous ?
                </h2>
              </div>
              
              <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl p-8 sm:p-12 md:p-16 shadow-2xl shadow-emerald-500/5">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 pointer-events-none" />
                <div className="relative space-y-10">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed font-light">
                      Chez <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Cool Voyage</span>, tout est soigneusement préparé pour vous accueillir dans les meilleures conditions. Une équipe compétente et une organisation rigoureuse vous attendent, avec tout le nécessaire pour votre confort, y compris une restauration adaptée à tous.
                    </p>
                  </div>
                  
                  <div className="mt-12 pt-12 border-t border-border/50">
                    <h3 className="mb-6 text-2xl sm:text-3xl font-semibold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Nos Services
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto mb-10">
                      <span className="font-semibold text-foreground">Cool Voyage</span> peut organiser des <span className="font-semibold text-foreground">voyages privés</span>, 
                      <span className="font-semibold text-foreground"> entre amis</span>, selon <span className="font-semibold text-foreground">votre budget</span>. 
                      Que vous soyez en groupe ou en solo, nous adaptons nos offres à vos besoins !
                    </p>
                    
                    <div className="grid gap-6 sm:gap-8 sm:grid-cols-3 mt-12">
                      <div className="group relative text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1">
                        <div className="text-5xl mb-4 transform transition-transform duration-300 group-hover:scale-110">👥</div>
                        <p className="text-base font-semibold text-foreground">Voyages privés</p>
                      </div>
                      <div className="group relative text-center p-8 rounded-2xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20 border border-teal-200/50 dark:border-teal-800/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20 hover:-translate-y-1">
                        <div className="text-5xl mb-4 transform transition-transform duration-300 group-hover:scale-110">👫</div>
                        <p className="text-base font-semibold text-foreground">Entre amis</p>
                      </div>
                      <div className="group relative text-center p-8 rounded-2xl bg-gradient-to-br from-cyan-50/50 to-emerald-50/50 dark:from-cyan-950/20 dark:to-emerald-950/20 border border-cyan-200/50 dark:border-cyan-800/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-1">
                        <div className="text-5xl mb-4 transform transition-transform duration-300 group-hover:scale-110">💰</div>
                        <p className="text-base font-semibold text-foreground">Selon votre budget</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="destinations" className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.03),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-4xl mb-12 sm:mb-16 text-center">
              <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Nos Destinations
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground px-4 leading-relaxed">
                Découvrez les merveilles de Madagascar avec nos séjours organisés
              </p>
            </div>
            <div className="mx-auto max-w-[95vw] xl:max-w-[1400px]">
              <div className="grid gap-6 sm:gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                {destinationsData.map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 sm:mb-16 text-center">
                <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Galerie Photos
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground px-4 leading-relaxed">
                  Découvrez un aperçu de nos destinations à Madagascar
                </p>
              </div>
              <HomeGallery destinations={destinationsData} />
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-4xl">
              <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-emerald-50/30 via-teal-50/20 to-cyan-50/30 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 backdrop-blur-xl p-8 sm:p-12 md:p-16 text-center shadow-2xl shadow-emerald-500/10">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 pointer-events-none" />
                <div className="relative">
                  <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Prêt à partir à l  aventure ?
                  </h2>
                  <p className="mb-8 sm:mb-10 text-lg sm:text-xl text-muted-foreground px-4 leading-relaxed">
                    Contactez-nous dès aujourd hui pour organiser votre voyage de rêve à Madagascar
                  </p>
                  <SmoothScrollButtons />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterDynamic />
    </div>
  );
}
