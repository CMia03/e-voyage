"use client";

import { type ReactNode } from "react";
import {
  Bed,
  Boxes,
  Bus,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Flag,
  Grid2X2,
  MapPin,
  Route,
  UsersRound,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 3,
  }).format(value)} ${devise || "MGA"}`;
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

function getDayLabel(day: PlanificationVoyage["jours"][number] | null) {
  if (!day) return "-";
  return day.titre || `Jour ${day.numeroJour ?? "-"}`;
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

  const totalAutres = Math.max(0, totalBlocs - totalActivites - totalHebergements);
  const duree = calculateDurationInDays(planification.dateHeureDebut, planification.dateHeureFin);
  const budgetTotal = planification.budgetTotal ?? null;
  const devise = planification.deviseBudget || "MGA";
  const coutMoyenParJour = budgetTotal && duree && duree > 0 ? budgetTotal / duree : null;
  const premierJour = jours.length > 0 ? jours[0] : null;
  const dernierJour = jours.length > 0 ? jours[jours.length - 1] : null;

  const stats = [
    {
      label: "Duree du voyage",
      value: duree ? `${duree} jours` : "-",
      icon: CalendarDays,
      tone: "emerald",
    },
    {
      label: "Jours planifies",
      value: totalJours,
      icon: CalendarDays,
      tone: "sky",
    },
    {
      label: "Blocs programmes",
      value: totalBlocs,
      icon: Boxes,
      tone: "green",
    },
  ];

  const programItems = [
    { label: "Activites", value: totalActivites, icon: UsersRound, className: "text-emerald-600 bg-emerald-50" },
    { label: "Hebergements", value: totalHebergements, icon: Bed, className: "text-green-600 bg-green-50" },
    { label: "Transports", value: totalTransports, icon: Bus, className: "text-sky-600 bg-sky-50" },
    { label: "Autres blocs", value: totalAutres, icon: Grid2X2, className: "text-orange-600 bg-orange-50" },
  ];

  return (
    <Card className="overflow-hidden border-slate-200 bg-slate-50/60 shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Route className="size-6" />
              </div>
              <div className="min-w-0">

                {/* <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Synthese administrative
                </p> */}

                <h2 className="mt-1 break-words text-2xl font-bold text-slate-950">
                  {planification.nomPlanification || "Planification sans titre"}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="size-4 text-emerald-600" />
                  {planification.nomDestination || "Destination non renseignee"}
                </p>
              </div>
            </div>

            {/* <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[360px]">
              <AdminStatus label="Depart" value={planification.depart || "-"} />
              <AdminStatus label="Arrivee" value={planification.arriver || "-"} />
              <AdminStatus label="Devise" value={devise} />
              <AdminStatus
                label="Etat client"
                value={planification.estVisibleClient ? "Visible" : "Masquee"}
                muted={!planification.estVisibleClient}
              />
            </div> */}

          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const toneClass =
              stat.tone === "amber"
                ? "bg-amber-50 text-amber-600"
                : stat.tone === "sky"
                  ? "bg-sky-50 text-sky-600"
                  : "bg-emerald-50 text-emerald-600";

            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`flex size-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
                    <Icon className="size-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="mt-1 break-words text-2xl font-bold text-slate-950">{stat.value}</p>
                    {stat.caption ? <p className="mt-1 text-xs text-slate-500">{stat.caption}</p> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SummaryPanel icon={CalendarDays} title="Periode">
            <InfoLine label="Debut" value={formatDateTime(planification.dateHeureDebut)} />
            <InfoLine label="Fin" value={formatDateTime(planification.dateHeureFin)} />
          </SummaryPanel>

          <SummaryPanel icon={CircleDollarSign} title="Budget">
            <InfoLine label="Cout moyen / jour" value={coutMoyenParJour ? formatMoney(coutMoyenParJour, devise) : "-"} />
            <div className="flex items-center gap-3 text-sm text-slate-900">
              <span className="font-semibold">Statut budget :</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {budgetTotal ? "Budget renseigne" : "Budget non defini"}
              </span>
            </div>
          </SummaryPanel>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.35fr]">
          <SummaryPanel icon={Route} title="Repartition du programme">
            <div className="grid grid-cols-2 gap-3">
              {programItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className={`mb-3 flex size-10 items-center justify-center rounded-full ${item.className}`}>
                      <Icon className="size-5" />
                    </div>
                    <p className="text-xs text-slate-600">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </SummaryPanel>

          <SummaryPanel icon={Flag} title="Reperes de planification">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-5">
                <Milestone icon={CalendarDays} color="text-emerald-600" label="Premier jour" value={getDayLabel(premierJour)} />
                <Milestone icon={CheckCircle2} color="text-sky-600" label="Dernier jour" value={getDayLabel(dernierJour)} />
                <Milestone icon={MapPin} color="text-green-600" label="Depart" value={planification.depart || "-"} />
                <Milestone icon={MapPin} color="text-red-500" label="Arrivee" value={planification.arriver || "-"} />
              </div>

              {/* <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Controle admin</p>
                <div className="mt-4 space-y-3">
                  <ControlLine label="ID planning" value={planification.id} />
                  <ControlLine label="Destination" value={planification.nomDestination || "-"} />
                  <ControlLine label="Budget" value={budgetTotal ? "Renseigne" : "A completer"} />
                  <ControlLine label="Publication" value={planification.estVisibleClient ? "Client" : "Admin seul"} />
                </div>
              </div> */}
              
            </div>
          </SummaryPanel>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="size-5 text-emerald-600" />
        <p className="font-semibold text-slate-950">{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-900">
      <span className="mr-3 font-semibold">{label} :</span>
      {value}
    </p>
  );
}

function AdminStatus({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${muted ? "text-slate-500" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function ControlLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="max-w-[150px] truncate text-right text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Milestone({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className={`mt-0.5 size-5 shrink-0 ${color}`} />
      <p className="min-w-0 text-slate-900">
        <span className="font-semibold">{label} :</span> {value}
      </p>
    </div>
  );
}
