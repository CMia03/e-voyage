import Link from "next/link";
import { getEntrepriseInfoPublic } from "@/lib/api/entreprise-info";

type FooterInfo = {
  nomEntreprise: string;
  description: string;
  contactYas: string;
  contactOrange: string;
  contactAirtel: string;
  contactGmail: string;
  contactPlusInfos: string;
  adresse: string;
};

function toPhoneHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export async function FooterDynamic() {
  const currentYear = new Date().getFullYear();
  let info: FooterInfo | null = null;

  try {
    const response = await getEntrepriseInfoPublic();
    const data = response.data;
    if (data) {
      info = {
        nomEntreprise: data.nomEntreprise || "",
        description: data.description || "",
        contactYas: data.contactYas || "",
        contactOrange: data.contactOrange || "",
        contactAirtel: data.contactAirtel || "",
        contactGmail: data.contactGmail || "",
        contactPlusInfos: data.contactPlusInfos || "",
        adresse: data.adresse || "",
      };
    }
  } catch {
    info = null;
  }

  // If no data or all fields are empty, show "A revoir"
  const isEmpty = !info || (
    !info.nomEntreprise && 
    !info.description && 
    !info.contactYas && 
    !info.contactOrange && 
    !info.contactAirtel && 
    !info.contactGmail && 
    !info.contactPlusInfos && 
    !info.adresse
  );

  if (isEmpty) {
    return (
      <footer id="contact" className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-muted-foreground">A revoir</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer id="contact" className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-xl font-bold">🌴 {info.nomEntreprise}</h3>
              <p className="text-sm text-muted-foreground">{info.description}</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Destinations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#destinations" className="hover:text-primary">
                    Ambila Lemaintso
                  </Link>
                </li>
                <li>
                  <Link href="#destinations" className="hover:text-primary">
                    Manambato
                  </Link>
                </li>
                <li>
                  <Link href="#destinations" className="hover:text-primary">
                    Sainte-Marie
                  </Link>
                </li>
                <li>
                  <Link href="#destinations" className="hover:text-primary">
                    Le Grand Sud
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {info.contactYas ? (
                  <li className="flex items-center gap-2">
                    <span>📱</span>
                    <a href={toPhoneHref(info.contactYas)} className="hover:text-primary">
                      Yas : {info.contactYas}
                    </a>
                  </li>
                ) : null}
                {info.contactOrange ? (
                  <li className="flex items-center gap-2">
                    <span>📱</span>
                    <a href={toPhoneHref(info.contactOrange)} className="hover:text-primary">
                      Orange : {info.contactOrange}
                    </a>
                  </li>
                ) : null}
                {info.contactAirtel ? (
                  <li className="flex items-center gap-2">
                    <span>📱</span>
                    <a href={toPhoneHref(info.contactAirtel)} className="hover:text-primary">
                      Airtel : {info.contactAirtel}
                    </a>
                  </li>
                ) : null}
                {info.contactGmail ? (
                  <li className="flex items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${info.contactGmail}`} className="hover:text-primary">
                      Gmail : {info.contactGmail}
                    </a>
                  </li>
                ) : null}
                {info.contactPlusInfos ? (
                  <li className="flex items-center gap-2">
                    <span>☎️</span>
                    <a href={toPhoneHref(info.contactPlusInfos)} className="hover:text-primary">
                      Plus d&apos;infos : {info.contactPlusInfos}
                    </a>
                  </li>
                ) : null}
                {info.adresse ? (
                  <li className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{info.adresse}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; {currentYear} {info.nomEntreprise}. Tous droits reserves.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

