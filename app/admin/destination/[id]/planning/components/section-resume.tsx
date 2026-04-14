"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanificationVoyage } from "@/lib/type/destination";

type Props = {
  planification: PlanificationVoyage;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value?: number | null, devise?: string | null) {
  if (value === null || value === undefined) return "-";
  return `${new Intl.NumberFormat("fr-FR").format(value)} ${devise || "MGA"}`;
}

function calculateDurationInDays(start?: string | null, end?: string | null) {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return null;

  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function SectionResume({ planification }: Props) {
  const jours = planification.jours ?? [];
  const transports = planification.transports ?? [];

  const totalJours = jours.length;
  const totalTransports = transports.length;
  const totalBlocs = jours.reduce((sum, jour) => sum + (jour.elements?.length ?? 0), 0);

  const totalActivites = jours.reduce(
    (sum, jour) =>
      sum +
      (jour.elements?.filter((element) => element.codeTypeElementJour === "ACTIVITE").length ?? 0),
    0
  );

  const totalHebergements = jours.reduce(
    (sum, jour) =>
      sum +
      (jour.elements?.filter((element) => element.codeTypeElementJour === "HEBERGEMENT").length ?? 0),
    0
  );

  const totalAutres = totalBlocs - totalActivites - totalHebergements;

  const duree = calculateDurationInDays(planification.dateHeureDebut, planification.dateHeureFin);

  const budgetTotal = planification.budgetTotal ?? null;
  const devise = planification.deviseBudget || "MGA";
  const coutMoyenParJour =
    budgetTotal && duree && duree > 0 ? budgetTotal / duree : null;

  const premierJour = jours.length > 0 ? jours[0] : null;
  const dernierJour = jours.length > 0 ? jours[jours.length - 1] : null;

  const synthese = `
Cette planification couvre ${totalJours} jour(s) avec ${totalBlocs} bloc(s) programmés.
Elle comprend ${totalActivites} activité(s), ${totalHebergements} hébergement(s) et ${totalTransports} transport(s).
${
  budgetTotal
    ? `Le budget total prévu est de ${formatMoney(budgetTotal, devise)}${
        coutMoyenParJour ? `, soit environ ${formatMoney(coutMoyenParJour, devise)} par jour` : ""
      }.`
    : "Le budget total n’est pas encore renseigné."
}
  `.trim();

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <CardTitle>Résumé du voyage</CardTitle>
        <CardDescription>
          Vue synthétique de la planification, du volume d’activités et du cadre budgétaire.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Nom du voyage</p>
            <p className="mt-1 text-sm font-semibold">{planification.nomPlanification || "-"}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Durée</p>
            <p className="mt-1 text-sm font-semibold">{duree ? `${duree} jour(s)` : "-"}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Jours planifiés</p>
            <p className="mt-1 text-sm font-semibold">{totalJours}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Blocs programmés</p>
            <p className="mt-1 text-sm font-semibold">{totalBlocs}</p>
          </div>

          {/* <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Budget total</p>
            <p className="mt-1 text-sm font-semibold">{formatMoney(budgetTotal, devise)}</p>
          </div> */}

        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Période</p>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">Début :</span> {formatDateTime(planification.dateHeureDebut)}</p>
              <p><span className="font-medium">Fin :</span> {formatDateTime(planification.dateHeureFin)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Budget moyen</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">Coût moyen / jour :</span>{" "}
                {coutMoyenParJour ? formatMoney(coutMoyenParJour, devise) : "-"}
              </p>
              <p>
                <span className="font-medium">Statut budget :</span>{" "}
                {budgetTotal ? "Budget renseigné" : "Budget non défini"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Répartition du programme</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Activités</p>
                <p className="font-semibold">{totalActivites}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Hébergements</p>
                <p className="font-semibold">{totalHebergements}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Transports</p>
                <p className="font-semibold">{totalTransports}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Autres blocs</p>
                <p className="font-semibold">{Math.max(0, totalAutres)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Repères de planification</p>
            <div className="mt-2 space-y-2 text-sm">
              <p>
                <span className="font-medium">Premier jour :</span>{" "}
                {premierJour?.titre || (premierJour ? `Jour ${premierJour.numeroJour}` : "-")}
              </p>
              <p>
                <span className="font-medium">Dernier jour :</span>{" "}
                {dernierJour?.titre || (dernierJour ? `Jour ${dernierJour.numeroJour}` : "-")}
              </p>
              <p>
                <span className="font-medium">Départ :</span> {planification.depart || "-"}
              </p>
              <p>
                <span className="font-medium">Arrivée :</span> {planification.arriver || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Synthèse</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{synthese}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{totalJours} jour(s)</Badge>
          <Badge variant="outline">{totalBlocs} bloc(s)</Badge>
          <Badge variant="outline">{totalTransports} transport(s)</Badge>
          <Badge variant="secondary">{devise}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}