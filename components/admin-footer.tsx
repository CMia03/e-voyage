export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} E-Voyage Administration. Tous droits réservés.
          </p>
          <p className="mt-1">
            Panel d'administration sécurisé
          </p>
        </div>
      </div>
    </footer>
  );
}
