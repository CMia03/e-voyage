import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer id="contact" className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-xl font-bold">🌴 Cool Voyage</h3>
              <p className="text-sm text-muted-foreground">
                Votre agence de voyage de confiance pour découvrir Madagascar. 
                Des séjours organisés à prix abordables vers les plus belles destinations.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Destinations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#destinations" className="hover:text-primary">Ambila Lemaintso</Link></li>
                <li><Link href="#destinations" className="hover:text-primary">Manambato</Link></li>
                <li><Link href="#destinations" className="hover:text-primary">Sainte-Marie</Link></li>
                <li><Link href="#destinations" className="hover:text-primary">Le Grand Sud</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  <a href="tel:0346688542" className="hover:text-primary">Yas : +261 34 66 885 42</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  <a href="tel:0325559616" className="hover:text-primary">Orange : +261 32 55 596 16</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>☎️</span>
                  <a href="tel:0346688542" className="hover:text-primary">Plus d'infos : +261 34 66 885 42</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Antananarivo, Madagascar</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {currentYear} Cool Voyage. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

