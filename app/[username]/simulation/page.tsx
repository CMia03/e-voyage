"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { BellRing, Expand, X } from "lucide-react";

import { useSimulation } from "@/lib/hooks/useSimulation";
import { ElementSelection, ElementSimulation, JourSimulation, VoyageurProfile } from "@/lib/type/simulation.types";
import { BudgetInput } from "./components/BudgetInput";
import { CategoryGammeSelector } from "./components/CategoryGammeSelector";
import { BudgetSummary } from "./components/BudgetSummary";
import { ActionButtons } from "./components/ActionButtons";
import { ImageGalleryDialog, ImageGalleryState } from "./components/ImageGalleryDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PlanningJournalier = dynamic(
  () => import("./components/PlanningJournalier").then((mod) => mod.PlanningJournalier),
  { ssr: false }
);

type SuggestedElement = {
  id: string;
  titre: string;
  prix: number;
  type: string;
  jourNumero?: number;
  jourTitre?: string;
  heureDebut?: string | null;
  heureFin?: string | null;
  images?: string[];
  quantiteSelectionnee: number;
  prixParPersonne: number;
  quantiteSuggeree: number;
  quantiteRetiree: number;
  economieSuggeree: number;
};

type ReservationElementPreview = {
  id: string;
  titre: string;
  prix: number;
  type: string;
  quantite?: number;
  jourNumero?: number;
  jourTitre?: string;
};

type DraggableSuggestionPanelProps = {
  children: ReactNode;
  className: string;
  closeButtonClassName: string;
  dragToneClassName: string;
  header: ReactNode;
  label: string;
  onClose: () => void;
};

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function DraggableSuggestionPanel({
  children,
  className,
  closeButtonClassName,
  dragToneClassName,
  header,
  label,
  onClose,
}: DraggableSuggestionPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
    rect: DOMRect;
  } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
    rect: DOMRect;
    direction: ResizeDirection;
  } | null>(null);

  const panelStyle = {
    "--suggestion-panel-x": `${offset.x}px`,
    "--suggestion-panel-y": `${offset.y}px`,
    "--suggestion-panel-content-height": size
      ? `${Math.max(size.height - 92, 180)}px`
      : "calc(100vh - 14rem)",
    width: size ? `${size.width}px` : undefined,
    height: size ? `${size.height}px` : undefined,
    maxWidth: "calc(100vw - 1.5rem)",
    maxHeight: "calc(100vh - 1.5rem)",
  } as CSSProperties;

  const handleDragStart = (event: ReactPointerEvent<HTMLElement>) => {
    const panel = panelRef.current;
    if (!panel) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      rect: panel.getBoundingClientRect(),
    };
    setIsDragging(true);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;

    const rawDeltaX = event.clientX - dragStart.pointerX;
    const rawDeltaY = event.clientY - dragStart.pointerY;
    const margin = 12;
    const minDeltaX = margin - dragStart.rect.left;
    const maxDeltaX = window.innerWidth - margin - dragStart.rect.right;
    const minDeltaY = margin - dragStart.rect.top;
    const maxDeltaY = window.innerHeight - margin - dragStart.rect.bottom;
    const deltaX = Math.min(maxDeltaX, Math.max(minDeltaX, rawDeltaX));
    const deltaY = Math.min(maxDeltaY, Math.max(minDeltaY, rawDeltaY));

    setOffset({
      x: dragStart.offsetX + deltaX,
      y: dragStart.offsetY + deltaY,
    });
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handleResizeStart = (
    event: ReactPointerEvent<HTMLButtonElement>,
    direction: ResizeDirection
  ) => {
    const panel = panelRef.current;
    if (!panel) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = panel.getBoundingClientRect();
    resizeStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      rect,
      direction,
    };
    setIsResizing(true);
  };

  const handleResizeMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resizeStart = resizeStartRef.current;
    if (!resizeStart) return;

    const margin = 12;
    const minWidth = 300;
    const minHeight = 260;
    const deltaX = event.clientX - resizeStart.pointerX;
    const deltaY = event.clientY - resizeStart.pointerY;
    const direction = resizeStart.direction;
    const startRect = resizeStart.rect;
    let nextLeft = startRect.left;
    let nextRight = startRect.right;
    let nextTop = startRect.top;
    let nextBottom = startRect.bottom;

    if (direction.includes("w")) {
      nextLeft = Math.min(
        startRect.right - minWidth,
        Math.max(margin, startRect.left + deltaX)
      );
    }
    if (direction.includes("e")) {
      nextRight = Math.max(
        startRect.left + minWidth,
        Math.min(window.innerWidth - margin, startRect.right + deltaX)
      );
    }
    if (direction.includes("n")) {
      nextTop = Math.min(
        startRect.bottom - minHeight,
        Math.max(margin, startRect.top + deltaY)
      );
    }
    if (direction.includes("s")) {
      nextBottom = Math.max(
        startRect.top + minHeight,
        Math.min(window.innerHeight - margin, startRect.bottom + deltaY)
      );
    }

    setSize({
      width: nextRight - nextLeft,
      height: nextBottom - nextTop,
    });
    setOffset({
      x: resizeStart.offsetX + nextLeft - startRect.left,
      y: resizeStart.offsetY + nextTop - startRect.top,
    });
  };

  const handleResizeEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeStartRef.current = null;
    setIsResizing(false);
  };

  return (
    <section
      ref={panelRef}
      style={panelStyle}
      className={`${className} translate-x-[var(--suggestion-panel-x)] translate-y-[var(--suggestion-panel-y)] ${
        isDragging || isResizing ? "select-none shadow-[0_30px_90px_-34px_rgba(15,23,42,0.55)]" : ""
      }`}
    >
      <div
        aria-label={`Deplacer ${label}`}
        className="mb-4 flex cursor-grab touch-none select-none items-start justify-between gap-3 rounded-2xl px-1 py-1 active:cursor-grabbing"
        role="button"
        tabIndex={0}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="min-w-0">{header}</div>
        <button
          type="button"
          aria-label="Fermer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border bg-white/85 transition ${closeButtonClassName}`}
        >
          <X className="size-4" />
        </button>
      </div>
      {children}
      {[
        { direction: "n", className: "left-10 right-10 top-0 h-2 cursor-ns-resize" },
        { direction: "s", className: "bottom-0 left-10 right-10 h-2 cursor-ns-resize" },
        { direction: "e", className: "bottom-10 right-0 top-10 w-2 cursor-ew-resize" },
        { direction: "w", className: "bottom-10 left-0 top-10 w-2 cursor-ew-resize" },
        { direction: "ne", className: "right-0 top-0 size-8 cursor-nesw-resize" },
        { direction: "nw", className: "left-0 top-0 size-8 cursor-nwse-resize" },
        { direction: "se", className: "bottom-0 right-0 size-8 cursor-nwse-resize" },
        { direction: "sw", className: "bottom-0 left-0 size-8 cursor-nesw-resize" },
      ].map((handle) => (
        <button
          key={handle.direction}
          type="button"
          aria-label={`Redimensionner ${label}`}
          className={`absolute touch-none rounded-xl opacity-0 transition hover:opacity-100 focus-visible:opacity-100 ${handle.className} ${dragToneClassName}`}
          onPointerDown={(event) =>
            handleResizeStart(event, handle.direction as ResizeDirection)
          }
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
        />
      ))}
      <span className="pointer-events-none absolute bottom-2 right-2 block size-3 border-b-2 border-r-2 border-slate-400/80" />
    </section>
  );
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeGamme(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized === "LUXE" ? "LUXE" : "MOYENNE";
}

function parseVoyageurProfiles(
  value: string | null,
  fallbackCategorieId: string | null,
  fallbackGamme: string,
  fallbackNombrePersonnes: number
): VoyageurProfile[] {
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const profiles = parsed
          .map((item) => ({
            categorieClientId:
              typeof item?.categorieClientId === "string" ? item.categorieClientId : "",
            gamme:
              typeof item?.gamme === "string" && item.gamme.trim()
                ? item.gamme.trim().toUpperCase()
                : fallbackGamme,
            nombrePersonnes:
              typeof item?.nombrePersonnes === "number" && item.nombrePersonnes > 0
                ? item.nombrePersonnes
                : 1,
          }))
          .filter((item) => !!item.categorieClientId);

        if (profiles.length > 0) {
          return profiles;
        }
      }
    } catch {
      return [];
    }
  }

  return fallbackCategorieId
    ? [{ categorieClientId: fallbackCategorieId, gamme: fallbackGamme, nombrePersonnes: fallbackNombrePersonnes }]
    : [];
}

function totalVoyageurs(profiles: VoyageurProfile[]): number {
  return profiles.reduce((sum, profile) => sum + Math.max(profile.nombrePersonnes || 0, 0), 0);
}

function parseElementSelections(value: string | null): ElementSelection[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        elementId: typeof item?.elementId === "string" ? item.elementId : "",
        quantite: typeof item?.quantite === "number" ? item.quantite : 0,
      }))
      .filter((item) => !!item.elementId && item.quantite > 0);
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((elementId) => ({ elementId, quantite: 1 }));
  }
}

function parseSimulationElementCards(value: string | null): ReservationElementPreview[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        titre: typeof item?.titre === "string" ? item.titre : "",
        prix: typeof item?.prix === "number" ? item.prix : 0,
        type: typeof item?.type === "string" ? item.type : "",
        quantite: typeof item?.quantite === "number" ? item.quantite : undefined,
        jourNumero: typeof item?.jourNumero === "number" ? item.jourNumero : undefined,
        jourTitre: typeof item?.jourTitre === "string" ? item.jourTitre : undefined,
      }))
      .filter((item) => item.id);
  } catch {
    return [];
  }
}

function getOptionalSuggestions(
  jours: JourSimulation[] | undefined,
  deficit: number
): SuggestedElement[] {
  if (!jours || deficit <= 0) return [];

  const optionnels = jours
    .flatMap((jour) => jour.elements.map((element) => ({ jour, element })))
    .filter(
      ({ element }) =>
        !element.obligatoire &&
        (element.quantiteSelectionnee ?? 0) > 0 &&
        getElementUnitPrice(element) > 0
    )
    .sort((a, b) => getElementUnitPrice(b.element) - getElementUnitPrice(a.element));

  const suggestions = optionnels
    .map(({ jour, element }) => {
      const quantiteSelectionnee = Math.max(element.quantiteSelectionnee ?? 0, 0);
      const prixParPersonne = getElementUnitPrice(element);
      const schedule = getElementSchedule(element);

      return {
        id: element.id,
        titre: element.titre,
        prix: Math.round(prixParPersonne * quantiteSelectionnee),
        type: element.type,
        jourNumero: jour.numeroJour,
        jourTitre: jour.titre,
        ...schedule,
        quantiteSelectionnee,
        prixParPersonne: Math.round(prixParPersonne),
        quantiteSuggeree: quantiteSelectionnee,
        quantiteRetiree: 0,
        economieSuggeree: 0,
      };
    })
    .filter((element) => element.quantiteSelectionnee > 0 && element.prixParPersonne > 0);

  if (suggestions.length === 0) return [];

  let economieCumulee = 0;
  while (economieCumulee < deficit) {
    let progress = false;

    for (const suggestion of suggestions) {
      if (economieCumulee >= deficit) break;
      if (suggestion.quantiteSuggeree <= 0) continue;

      suggestion.quantiteSuggeree -= 1;
      suggestion.quantiteRetiree += 1;
      suggestion.economieSuggeree += suggestion.prixParPersonne;
      economieCumulee += suggestion.prixParPersonne;
      progress = true;
    }

    if (!progress) break;
  }

  return suggestions.filter((element) => element.quantiteRetiree > 0);
}

function getElementUnitPrice(element: ElementSimulation): number {
  const details = element.details as ElementSimulation["details"] & {
    prixParHeur?: number;
    prixReservation?: number;
    budgetPrevu?: number;
    montant?: number;
    prixUnitaire?: number;
  };
  const quantiteSelectionnee = Math.max(Number(element.quantiteSelectionnee) || 0, 0);
  const prixElement = Number(element.prix) || 0;

  if (prixElement > 0) {
    return Math.round(
      quantiteSelectionnee > 1 ? prixElement / quantiteSelectionnee : prixElement
    );
  }

  return Math.round(
    Number(details?.prixParPersonne) ||
      Number(details?.prixParNuit) ||
      Number(details?.prixParHeur) ||
      Number(details?.prixReservation) ||
      Number(details?.prixUnitaire) ||
      Number(details?.budgetPrevu) ||
      Number(details?.montant) ||
      0
  );
}

function getElementSchedule(element: ElementSimulation) {
  const details = element.details as ElementSimulation["details"] & {
    heureDebut?: string | null;
    heureFin?: string | null;
    dateHeureDebut?: string | null;
    dateHeureFin?: string | null;
    debut?: string | null;
    fin?: string | null;
    image?: string | null;
    images?: Array<string | null | undefined>;
    urlImage?: string | null;
    urlImagePrincipale?: string | null;
    imagePrincipale?: string | null;
    photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>;
    tarifs?: Array<{
      urlImage?: string | null;
      image?: string | null;
      images?: Array<string | null | undefined>;
      photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>;
    } | null | undefined>;
    chambres?: Array<{
      urlImage?: string | null;
      image?: string | null;
      images?: Array<string | null | undefined>;
      photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>;
    } | null | undefined>;
  };
  const collectPhotoUrls = (
    photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>
  ) =>
    (photos ?? []).flatMap((photo) => {
      if (typeof photo === "string") return [photo];
      if (!photo) return [];
      return [photo.urlImage, photo.image];
    });
  const nestedImageGroups = [...(details?.tarifs ?? []), ...(details?.chambres ?? [])].flatMap((item) =>
    item
      ? [
          item.urlImage,
          item.image,
          ...(Array.isArray(item.images) ? item.images : []),
          ...collectPhotoUrls(item.photos),
        ]
      : []
  );
  const images = [
    details?.urlImagePrincipale,
    details?.imagePrincipale,
    details?.urlImage,
    details?.image,
    ...(Array.isArray(details?.images) ? details.images : []),
    ...collectPhotoUrls(details?.photos),
    ...nestedImageGroups,
  ].filter((image): image is string => typeof image === "string" && image.trim().length > 0);

  return {
    heureDebut: details?.heureDebut ?? details?.dateHeureDebut ?? details?.debut ?? null,
    heureFin: details?.heureFin ?? details?.dateHeureFin ?? details?.fin ?? null,
    images: Array.from(new Set(images)),
  };
}

function getAffordableOptionalSuggestions(
  jours: JourSimulation[] | undefined,
  resteBudget: number,
  quantiteMaxFallback: number
): SuggestedElement[] {
  if (!jours || resteBudget <= 0) return [];

  const fallbackMax = Math.max(quantiteMaxFallback, 1);
  const candidats = jours
    .flatMap((jour) => jour.elements.map((element) => ({ jour, element })))
    .map(({ jour, element }): SuggestedElement | null => {
      if (element.obligatoire) return null;

      const quantiteSelectionnee = Math.max(Number(element.quantiteSelectionnee) || 0, 0);
      const rawQuantiteMax = Number(element.quantiteMax) || fallbackMax;
      const quantiteMax = Math.max(0, Math.min(rawQuantiteMax, fallbackMax));
      const quantiteRestante = Math.max(quantiteMax - quantiteSelectionnee, 0);
      const prixUnitaire = getElementUnitPrice(element);
      const schedule = getElementSchedule(element);

      if (quantiteRestante <= 0 || prixUnitaire <= 0 || prixUnitaire > resteBudget) {
        return null;
      }

      const quantiteAchetable = Math.min(
        quantiteRestante,
        Math.floor(resteBudget / prixUnitaire)
      );

      if (quantiteAchetable <= 0) return null;

      return {
        id: element.id,
        titre: element.titre,
        prix: prixUnitaire * quantiteAchetable,
        type: element.type,
        jourNumero: jour.numeroJour,
        jourTitre: jour.titre,
        ...schedule,
        quantiteSelectionnee,
        prixParPersonne: prixUnitaire,
        quantiteSuggeree: quantiteAchetable,
        quantiteRetiree: 0,
        economieSuggeree: 0,
      };
    })
    .filter((element): element is SuggestedElement => element !== null)
    .sort((a, b) => a.prixParPersonne - b.prixParPersonne);

  let budgetRestant = resteBudget;
  const suggestions: SuggestedElement[] = [];

  for (const element of candidats) {
    const quantiteAchetable = Math.min(
      element.quantiteSuggeree,
      Math.floor(budgetRestant / element.prixParPersonne)
    );

    if (quantiteAchetable <= 0) continue;

    const prixSuggestion = quantiteAchetable * element.prixParPersonne;
    suggestions.push({
      ...element,
      prix: prixSuggestion,
      quantiteSuggeree: quantiteAchetable,
    });

    budgetRestant -= prixSuggestion;
    if (budgetRestant <= 0) break;
  }

  return suggestions;
}

function willCompleteAllPlanningElementsAfterAddition(
  jours: JourSimulation[] | undefined,
  elementId: string,
  quantityToAdd: number,
  quantiteMaxFallback: number
): boolean {
  if (!jours) return false;

  const fallbackMax = Math.max(quantiteMaxFallback, 1);
  const elements = jours.flatMap((jour) => jour.elements);
  if (elements.length === 0) return false;

  return elements.every((element) => {
    const selectedQuantity = Math.max(Number(element.quantiteSelectionnee) || 0, 0);
    const rawMaxQuantity = Number(element.quantiteMax) || fallbackMax;
    const maxQuantity = Math.max(0, Math.min(rawMaxQuantity, fallbackMax));
    const nextQuantity =
      element.id === elementId ? selectedQuantity + quantityToAdd : selectedQuantity;

    return nextQuantity >= maxQuantity;
  });
}

function formatAr(value?: number | null) {
  return `${(value ?? 0).toLocaleString()} Ar`;
}

function formatDisplayText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/‚/g, "é")
    .replace(/…/g, "à")
    .replace(/–/g, "û")
    .replace(/“/g, "ô")
    .replace(/Š/g, "è")
    .replace(/Œ/g, "î")
    .replace(/×/g, "Î")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã®/g, "î")
    .replace(/Ã´/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã§/g, "ç");
}

function formatSuggestionType(value: string) {
  const normalized = formatDisplayText(value).trim().toLowerCase();
  if (normalized === "hebergement" || normalized === "hébergement") return "hébergement";
  if (normalized === "activite" || normalized === "activité") return "activité";
  return normalized;
}

function formatScheduleTime(value?: string | null) {
  const rawValue = formatDisplayText(value).trim();
  if (!rawValue) return "";

  const timeMatch = rawValue.match(/(?:T|\s)(\d{2}:\d{2})(?::\d{2})?/) ?? rawValue.match(/^(\d{2}:\d{2})(?::\d{2})?/);
  return timeMatch?.[1] ?? rawValue;
}

function formatSuggestionPlanningContext(element: SuggestedElement) {
  const dayTitle = formatDisplayText(element.jourTitre).trim();
  const dayLabel = element.jourNumero
    ? `Jour ${element.jourNumero}${dayTitle ? ` - ${dayTitle}` : ""}`
    : dayTitle || "Jour non renseigné";
  const startTime = formatScheduleTime(element.heureDebut);
  const endTime = formatScheduleTime(element.heureFin);
  const timeLabel =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime
        ? `Début ${startTime}`
        : endTime
          ? `Fin ${endTime}`
          : "";

  return timeLabel ? `${dayLabel} · ${timeLabel}` : dayLabel;
}

function buildSimulationSummary(
  destinationTitle: string | undefined,
  planificationTitle: string | undefined,
  nombrePersonnes: number,
  budgetClient: number | undefined,
  totalAvecMarge: number | undefined,
  reste: number | undefined
) {
  return [
    destinationTitle ? `Destination: ${destinationTitle}` : null,
    planificationTitle ? `Planification: ${planificationTitle}` : null,
    `Nombre de personnes: ${nombrePersonnes}`,
    budgetClient !== undefined && budgetClient > 0 ? `Budget client: ${formatAr(budgetClient)}` : null,
    totalAvecMarge !== undefined ? `Total selectionne: ${formatAr(totalAvecMarge)}` : null,
    reste !== undefined ? `Reste budgetaire: ${formatAr(reste)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function SimulationPage() {
  const params = useParams<{ username: string }>();
  const username = typeof params?.username === "string" ? params.username : "client";
  const router = useRouter();
  const query = useSearchParams();
  const [isPlanningExpanded, setIsPlanningExpanded] = useState(false);
  const [suggestionGallery, setSuggestionGallery] = useState<ImageGalleryState | null>(null);
  const prefillAppliedRef = useRef(false);
  const autoSimulationLaunchedRef = useRef(false);
  const previousAutoBudgetRef = useRef<number | null>(null);
  const {
    destinations,
    planifications,
    categories,
    loading,
    error,
    result,
    minimumBudget,
    budgetByPlanification,
    selectedDestinationId,
    setSelectedDestinationId,
    selectedPlanificationId,
    setSelectedPlanificationId,
    budgetClient,
    setBudgetClient,
    voyageurProfiles,
    setVoyageurProfiles,
    elementsSelectionnes,
    setElementsSelectionnes,
    lancerSimulation,
    updateElementQuantity,
    toutCocher,
    toutDecocher,
    resetSimulation,
  } = useSimulation();

  const reservationEditPrefill = useMemo(
    () => ({
      editReservationId: query?.get("editReservationId") || null,
      commentaireClient: query?.get("commentaireClient") || null,
      budgetClient: parsePositiveInteger(query?.get("budgetClient"), 0),
      destinationId: query?.get("destinationId") || null,
      planificationId: query?.get("planificationId") || null,
      categorieId: query?.get("categorieId") || null,
      gamme: normalizeGamme(query?.get("gamme")),
      nombrePersonnes: parsePositiveInteger(query?.get("nombrePersonnes"), 1),
      voyageurProfiles: parseVoyageurProfiles(
        query?.get("voyageurProfiles"),
        query?.get("categorieId"),
        normalizeGamme(query?.get("gamme")),
        parsePositiveInteger(query?.get("nombrePersonnes"), 1)
      ),
      elementsSelectionnes: parseElementSelections(query?.get("elementsSelectionnes")),
      elementsDetails: parseSimulationElementCards(query?.get("elementsDetails")),
    }),
    [query]
  );

  useEffect(() => {
    if (!query || prefillAppliedRef.current) return;
    if (!reservationEditPrefill.destinationId && !reservationEditPrefill.planificationId) return;

    prefillAppliedRef.current = true;

    if (reservationEditPrefill.destinationId) {
      setSelectedDestinationId(reservationEditPrefill.destinationId);
    }
    if (reservationEditPrefill.voyageurProfiles.length > 0) {
      setVoyageurProfiles(reservationEditPrefill.voyageurProfiles);
    }
    if (reservationEditPrefill.budgetClient > 0) {
      setBudgetClient(reservationEditPrefill.budgetClient);
    }
    if (reservationEditPrefill.elementsSelectionnes.length > 0) {
      setElementsSelectionnes(reservationEditPrefill.elementsSelectionnes);
    }
  }, [
    query,
    reservationEditPrefill,
    setBudgetClient,
    setElementsSelectionnes,
    setSelectedDestinationId,
    setVoyageurProfiles,
  ]);

  useEffect(() => {
    if (!reservationEditPrefill.planificationId || planifications.length === 0) return;
    if (!planifications.some((planification) => planification.id === reservationEditPrefill.planificationId)) return;

    setSelectedPlanificationId(reservationEditPrefill.planificationId);
  }, [planifications, reservationEditPrefill.planificationId, setSelectedPlanificationId]);

  useEffect(() => {
    if (autoSimulationLaunchedRef.current) return;
    if (!reservationEditPrefill.editReservationId) return;
    if (!selectedDestinationId || !selectedPlanificationId || voyageurProfiles.length === 0) return;
    if (budgetClient <= 0) return;

    autoSimulationLaunchedRef.current = true;
    void lancerSimulation(
      reservationEditPrefill.elementsSelectionnes.length > 0
        ? reservationEditPrefill.elementsSelectionnes
        : undefined
    );
  }, [
    budgetClient,
    lancerSimulation,
    reservationEditPrefill.editReservationId,
    reservationEditPrefill.elementsSelectionnes,
    selectedDestinationId,
    selectedPlanificationId,
    voyageurProfiles,
  ]);

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.id === selectedDestinationId) ?? null,
    [destinations, selectedDestinationId]
  );

  const selectedPlanification = useMemo(
    () => planifications.find((planification) => planification.id === selectedPlanificationId) ?? null,
    [planifications, selectedPlanificationId]
  );
  const hasForfaitPrefill = Boolean(
    reservationEditPrefill.destinationId && reservationEditPrefill.planificationId
  );

  const budgetCategorieSelectionnee = selectedPlanificationId
    ? budgetByPlanification[selectedPlanificationId] ?? null
    : null;
  const seuilMinimum = minimumBudget?.seuilMinimum ?? result?.recap?.seuilMinimum ?? 0;
  const resultJours = result?.jours;
  const allPlanningElementsSelected = useMemo(() => {
    if (!resultJours) return false;
    const totalGroup = Math.max(totalVoyageurs(voyageurProfiles), 1);
    const elements = resultJours.flatMap((jour) => jour.elements);

    return (
      elements.length > 0 &&
      elements.every((element) => {
        const selectedQuantity = Math.max(Number(element.quantiteSelectionnee) || 0, 0);
        const maxQuantity = Math.max(0, Math.min(Number(element.quantiteMax) || totalGroup, totalGroup));
        return selectedQuantity >= maxQuantity;
      })
    );
  }, [resultJours, voyageurProfiles]);
  const totalSimulationAvecMarge =
    result?.resume?.totalAvecMarge ?? result?.resume?.totalCoche ?? 0;
  const totalFactureCorrige =
    allPlanningElementsSelected && budgetCategorieSelectionnee
      ? Math.max(totalSimulationAvecMarge, budgetCategorieSelectionnee)
      : totalSimulationAvecMarge;
  const resteBudgetCorrige = result ? budgetClient - totalFactureCorrige : 0;
  const depassement = Math.max(0, -resteBudgetCorrige);
  const resteDisponible = Math.max(0, resteBudgetCorrige);

  const suggestionsOptionnelles = useMemo(
    () => getOptionalSuggestions(resultJours, depassement),
    [resultJours, depassement]
  );
  const totalGroupeVoyageurs = Math.max(totalVoyageurs(voyageurProfiles), 1);
  const suggestionsDisponiblesCandidates = useMemo(
    () => getAffordableOptionalSuggestions(resultJours, resteDisponible, totalGroupeVoyageurs),
    [resultJours, resteDisponible, totalGroupeVoyageurs]
  );
  const suggestionsDisponibles = useMemo(() => {
    return suggestionsDisponiblesCandidates.filter(
      (element) => {
        const completesPlanning = willCompleteAllPlanningElementsAfterAddition(
          resultJours,
          element.id,
          element.quantiteSuggeree,
          totalGroupeVoyageurs
        );
        const totalApresAjout = totalSimulationAvecMarge + element.prix;
        const totalFactureApresAjout =
          completesPlanning && budgetCategorieSelectionnee
            ? Math.max(totalApresAjout, budgetCategorieSelectionnee)
            : totalApresAjout;

        return totalFactureApresAjout <= budgetClient;
      }
    );
  }, [
    resultJours,
    suggestionsDisponiblesCandidates,
    totalGroupeVoyageurs,
    totalSimulationAvecMarge,
    budgetCategorieSelectionnee,
    budgetClient,
  ]);
  const manquePourCompleterForfait = useMemo(() => {
    if (!result?.success || !budgetCategorieSelectionnee) return 0;
    if (budgetClient >= budgetCategorieSelectionnee) return 0;
    if (allPlanningElementsSelected || suggestionsDisponibles.length > 0) return 0;

    const hasOnlyFullPackageAdditions = suggestionsDisponiblesCandidates.some((element) =>
      willCompleteAllPlanningElementsAfterAddition(
        resultJours,
        element.id,
        element.quantiteSuggeree,
        totalGroupeVoyageurs
      )
    );

    return hasOnlyFullPackageAdditions ? budgetCategorieSelectionnee - budgetClient : 0;
  }, [
    result?.success,
    resultJours,
    budgetCategorieSelectionnee,
    budgetClient,
    allPlanningElementsSelected,
    suggestionsDisponibles,
    suggestionsDisponiblesCandidates,
    totalGroupeVoyageurs,
  ]);

  const totalSuggestions = suggestionsOptionnelles.reduce(
    (total, element) => total + element.economieSuggeree,
    0
  );
  const manqueApresSuggestions = Math.max(0, depassement - totalSuggestions);
  const suggestionsCouvrentDepassement =
    depassement > 0 && manqueApresSuggestions === 0;
  const [dismissedBudgetAlertKey, setDismissedBudgetAlertKey] = useState<string | null>(null);
  const [dismissedPositiveBudgetKey, setDismissedPositiveBudgetKey] = useState<string | null>(null);
  const budgetAlertKey = useMemo(
    () =>
      result?.success && depassement > 0 && suggestionsOptionnelles.length > 0
        ? `${selectedPlanificationId}-${JSON.stringify(voyageurProfiles)}-${depassement}-${suggestionsOptionnelles
            .map((element) => element.id)
            .join(",")}`
        : null,
    [
      result?.success,
      depassement,
      suggestionsOptionnelles,
      selectedPlanificationId,
      voyageurProfiles,
    ]
  );
  const positiveBudgetKey = useMemo(
    () =>
      result?.success && resteDisponible > 0 && suggestionsDisponibles.length > 0
        ? `${selectedPlanificationId}-${JSON.stringify(voyageurProfiles)}-${resteDisponible}-${suggestionsDisponibles
            .map((element) => element.id)
            .join(",")}`
        : null,
    [
      result?.success,
      resteDisponible,
      suggestionsDisponibles,
      selectedPlanificationId,
      voyageurProfiles,
    ]
  );
  const showBudgetAlertModal =
      budgetAlertKey !== null && dismissedBudgetAlertKey !== budgetAlertKey;
  const showBudgetAlertIndicator =
      budgetAlertKey !== null && dismissedBudgetAlertKey === budgetAlertKey;
  const showPositiveBudgetModal =
      positiveBudgetKey !== null &&
      dismissedPositiveBudgetKey !== positiveBudgetKey;
  const showPositiveBudgetIndicator =
      positiveBudgetKey !== null &&
      dismissedPositiveBudgetKey === positiveBudgetKey;
  const handlePlanningExpandedChange = (open: boolean) => {
    setIsPlanningExpanded(open);
  };

  useEffect(() => {
    if (seuilMinimum <= 0) return;
    const shouldSyncWithMinimum =
      budgetClient <= 0 ||
      (previousAutoBudgetRef.current !== null && budgetClient === previousAutoBudgetRef.current);

    if (!shouldSyncWithMinimum) return;

    setBudgetClient(seuilMinimum);
    previousAutoBudgetRef.current = seuilMinimum;
  }, [budgetClient, seuilMinimum, setBudgetClient]);

  const canSimulate =
    !loading &&
    hasForfaitPrefill &&
    !!selectedPlanificationId &&
    voyageurProfiles.length > 0 &&
    budgetClient > 0;

  const canReserveSimulation =
    !!result?.success &&
    resteBudgetCorrige >= 0 &&
    !!selectedDestinationId &&
    !!selectedPlanificationId &&
    voyageurProfiles.length > 0;

  const simulationElements = useMemo(() => {
    if (elementsSelectionnes.length > 0) {
      return elementsSelectionnes;
    }
    if (!result?.jours) {
      return [];
    }
    return result.jours.flatMap((jour) =>
      jour.elements
        .filter((element) => (element.quantiteSelectionnee ?? 0) > 0)
        .map((element) => ({ elementId: element.id, quantite: element.quantiteSelectionnee ?? 0 }))
    );
  }, [elementsSelectionnes, result]);
  const simulationElementDetails = useMemo<ReservationElementPreview[]>(() => {
    if (!result?.jours) {
      return [];
    }

    return result.jours.flatMap((jour) =>
      jour.elements
        .filter((element) => element.coche)
        .map((element) => ({
          id: element.id,
          titre: element.titre,
          prix: element.prix,
          type: element.type,
          quantite: element.quantiteSelectionnee ?? 0,
          jourNumero: jour.numeroJour,
          jourTitre: jour.titre,
        }))
    );
  }, [result]);

  const simulationSummary = useMemo(
    () =>
      buildSimulationSummary(
        selectedDestination?.title,
        selectedPlanification?.nomPlanification,
        totalVoyageurs(voyageurProfiles),
        budgetClient,
        totalFactureCorrige,
        resteBudgetCorrige
      ),
    [
      selectedDestination?.title,
      selectedPlanification?.nomPlanification,
      voyageurProfiles,
      budgetClient,
      totalFactureCorrige,
      resteBudgetCorrige,
    ]
  );

  const handleLancerSimulation = async () => {
    setDismissedBudgetAlertKey(null);
    setDismissedPositiveBudgetKey(null);
    await lancerSimulation();
  };

  const handleReserveSimulation = () => {
    if (!canReserveSimulation) return;

    const params = new URLSearchParams();
    params.set("source", "SIMULATION");
    params.set("destinationId", selectedDestinationId);
    params.set("planificationId", selectedPlanificationId);
      params.set("gamme", voyageurProfiles[0]?.gamme ?? "MOYENNE");
    params.set("nombrePersonnes", String(totalVoyageurs(voyageurProfiles)));
    if (voyageurProfiles.length > 0) {
      params.set("categorieId", voyageurProfiles[0].categorieClientId);
      params.set("voyageurProfiles", JSON.stringify(voyageurProfiles));
    }
    if (budgetClient > 0) {
      params.set("budgetClient", String(budgetClient));
    }
    if (reservationEditPrefill.editReservationId) {
      params.set("editReservationId", reservationEditPrefill.editReservationId);
    }
    if (reservationEditPrefill.commentaireClient) {
      params.set("commentaireClient", reservationEditPrefill.commentaireClient);
    }
    if (selectedDestination?.title) {
      params.set("destinationTitle", selectedDestination.title);
    }
    if (selectedPlanification?.nomPlanification) {
      params.set("planificationTitle", selectedPlanification.nomPlanification);
    }
    const selectedCategorie = categories.find(
      (categorie) => categorie.id === voyageurProfiles[0]?.categorieClientId
    );
    if (selectedCategorie?.nom) {
      params.set("categorieTitle", selectedCategorie.nom);
    }
      if (simulationElements.length > 0) {
        params.set("elementsSelectionnes", JSON.stringify(simulationElements));
      }
    if (simulationElementDetails.length > 0) {
      params.set("elementsDetails", JSON.stringify(simulationElementDetails));
    }
    if (simulationSummary) {
      params.set("resumeSimulation", simulationSummary);
    }

    router.push(`/${username}/reservations?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_#f7faf8_0%,_#ffffff_42%,_#f8fafc_100%)]">
      {showBudgetAlertIndicator ? (
          <button
            type="button"
            onClick={() => setDismissedBudgetAlertKey(null)}
            className="pointer-events-auto fixed right-4 top-28 z-[120] inline-flex items-center gap-3 rounded-full border border-amber-300 bg-white/95 px-4 py-3 text-left shadow-[0_16px_45px_-24px_rgba(217,119,6,0.75)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-50 sm:right-6"
          >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/70" />
            <BellRing className="relative z-10 h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Message
            </span>

            <p className="mt-2 text-sm leading-6 text-amber-900/85">
              Votre budget ne couvre pas encore tous les blocs selectionnes.
            </p>

          </span>
        </button>
      ) : null}

        {showPositiveBudgetIndicator ? (
          <button
            type="button"
            onClick={() => setDismissedPositiveBudgetKey(null)}
            className="pointer-events-auto fixed right-4 top-28 z-[120] inline-flex items-center gap-3 rounded-full border border-emerald-300 bg-white/95 px-4 py-3 text-left shadow-[0_16px_45px_-24px_rgba(16,185,129,0.75)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:right-6"
          >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/70" />
            <BellRing className="relative z-10 h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Suggestion
            </span>

            <span className="mt-1 block text-sm font-medium text-slate-900">
              Voir les blocs encore disponibles
            </span>

          </span>
        </button>
      ) : null}

      {manquePourCompleterForfait > 0 ? (
        <button
          type="button"
          className="pointer-events-auto fixed right-4 top-28 z-[120] inline-flex max-w-[min(360px,calc(100vw-2rem))] items-center gap-3 rounded-full border border-amber-300 bg-white/95 px-4 py-3 text-left shadow-[0_16px_45px_-24px_rgba(217,119,6,0.75)] backdrop-blur sm:right-6"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <BellRing className="relative z-10 h-5 w-5" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Forfait complet
            </span>
            <span className="mt-1 block text-sm font-medium leading-5 text-slate-900">
              Votre budget ne permet pas encore d&apos;ajouter les derniers blocs du voyage.
            </span>
          </span>
        </button>
      ) : null}

      {showBudgetAlertModal ? (
        <DraggableSuggestionPanel
          label="l'ajustement recommande"
          closeButtonClassName="border-amber-300 text-amber-900 hover:bg-amber-50"
          dragToneClassName="border-amber-200 bg-amber-100/80 text-amber-800 hover:bg-amber-100"
          header={
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                Ajustement recommande
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-amber-950">
                {suggestionsCouvrentDepassement
                  ? "Quelques options peuvent suffire."
                  : "Les options proposees reduisent le manque, mais ne suffisent pas."}
              </h3>
              <p className="mt-2 text-sm leading-6 text-amber-900/85">
                {/* Votre budget ne couvre pas encore toutes les quantites selectionnees.
                Prix masque cote client :  */}
                  Il manque <span className="font-semibold">{formatAr(depassement)}</span>{" "}
                  pour couvrir toutes les quantites selectionnees.
               
                {!suggestionsCouvrentDepassement ? (
                  <>
                    {" "}Les retraits affiches ameliorent la situation, mais il faudra encore ajuster votre choix.
                    {/* Prix masque cote client :
                      {" "}Apres ces retraits, il manquera encore{" "}
                      <span className="font-semibold">{formatAr(manqueApresSuggestions)}</span>.
                    */}
                  </>
                ) : null}
              </p>
            </>
          }
          onClose={() => {
            if (budgetAlertKey) {
              setDismissedBudgetAlertKey(budgetAlertKey);
            }
          }}
          className="pointer-events-auto fixed right-4 top-44 z-[120] max-h-[calc(100vh-12rem)] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-amber-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.99),_rgba(255,247,214,0.97))] p-4 shadow-[0_24px_80px_-38px_rgba(217,119,6,0.65)] sm:right-6"
        >
          <div className="flex max-h-[var(--suggestion-panel-content-height)] min-h-0 flex-col overflow-y-auto pr-6">

            <div className="mt-4 grid gap-3 sm:grid-cols-1">
              <div className="rounded-2xl border border-amber-300 bg-white/75 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Retraits proposes
                </p>
                <p className="mt-1 text-lg font-semibold text-amber-950">
                  {suggestionsOptionnelles.length} blocs
                  {/* Prix masque cote client : {formatAr(totalSuggestions)} */}
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-900/80">
                  Blocs optionnels que vous pouvez retirer pour alleger votre simulation.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {suggestionsOptionnelles.slice(0, 3).map((element) => (
                <div
                  key={element.id}
                  className="rounded-2xl border border-amber-200 bg-white/88 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{formatDisplayText(element.titre)}</p>
                      <p className="mt-1 text-xs text-amber-700">
                        Option {formatSuggestionType(element.type)}
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                        {formatSuggestionPlanningContext(element)}
                      </p>
                      {element.images?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSuggestionGallery({
                              title: formatDisplayText(element.titre),
                              images: element.images ?? [],
                              activeIndex: 0,
                            })
                          }
                          className="mt-2 text-xs font-semibold text-amber-800 underline-offset-4 hover:underline"
                        >
                          Voir image
                        </button>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">
                        Actuellement {element.quantiteSelectionnee} personne
                      </p>
                    </div>
                    {/* Prix masque cote client :
                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        - {formatAr(element.economieSuggeree)}
                      </p>
                    */}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2">
                    <div className="text-xs leading-5 text-amber-900/90">
                      {/* Prix masque cote client :
                        <p>
                          Prix par personne : <span className="font-semibold">{formatAr(element.prixParPersonne)}</span>
                        </p>
                        <p>
                          Economie sur ce bloc : <span className="font-semibold">{formatAr(element.economieSuggeree)}</span>
                        </p>
                      */}
                      <p>
                        Suggestion : passer à <span className="font-semibold">{element.quantiteSuggeree}</span> personne(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void updateElementQuantity(element.id, element.quantiteSuggeree)}
                      className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      {element.quantiteSuggeree > 0
                        ? `Passer à ${element.quantiteSuggeree} pers`
                        : "Retirer ce bloc"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-amber-900/80">
              Vous pouvez continuer à modifier le budget, reduire le nombre de personnes
              sur un bloc optionnel.
            </p>
          </div>
        </DraggableSuggestionPanel>
      ) : null}
        {showPositiveBudgetModal ? (
        <DraggableSuggestionPanel
          label="la suggestion budget"
          closeButtonClassName="border-emerald-300 text-emerald-900 hover:bg-emerald-50"
          dragToneClassName="border-emerald-200 bg-emerald-100/80 text-emerald-800 hover:bg-emerald-100"
          header={
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Suggestion budget
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-emerald-950">
                Votre budget permet encore quelques ajouts.
              </h3>
              <p className="mt-2 text-sm leading-6 text-emerald-900/85">
                Votre budget permet encore d&apos;ajouter certains blocs optionnels.
              </p>
            </>
          }
          onClose={() => {
            if (positiveBudgetKey) {
              setDismissedPositiveBudgetKey(positiveBudgetKey);
            }
          }}
          className="pointer-events-auto fixed right-4 top-44 z-[120] max-h-[calc(100vh-12rem)] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-emerald-200 bg-[linear-gradient(180deg,_rgba(236,253,245,0.99),_rgba(220,252,231,0.97))] p-4 shadow-[0_24px_80px_-38px_rgba(16,185,129,0.55)] sm:right-6"
        >
          <div className="flex max-h-[var(--suggestion-panel-content-height)] min-h-0 flex-col overflow-y-auto pr-6">
            <div className="mt-4 rounded-2xl border border-emerald-300 bg-white/75 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Options disponibles
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {suggestionsDisponibles.length} blocs
                {/* Prix masque cote client : {formatAr(totalSuggestionsDisponibles)} */}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                Vous pouvez ajouter ces options sans depasser votre budget.
              </p>
              {/* Prix masque cote client :
                <p className="mt-1 text-xs text-emerald-800/80">
                  Budget restant apres ajout : {formatAr(resteApresSuggestions)}
                </p>
              */}
            </div>

            <div className="mt-4 space-y-2.5">
              {suggestionsDisponibles.slice(0, 4).map((element) => (
                <div
                  key={element.id}
                  className="rounded-2xl border border-emerald-200 bg-white/88 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{formatDisplayText(element.titre)}</p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {formatSuggestionType(element.type)}
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                        {formatSuggestionPlanningContext(element)}
                      </p>
                      {element.images?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSuggestionGallery({
                              title: formatDisplayText(element.titre),
                              images: element.images ?? [],
                              activeIndex: 0,
                            })
                          }
                          className="mt-2 text-xs font-semibold text-emerald-800 underline-offset-4 hover:underline"
                        >
                          Voir image
                        </button>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">
                        {element.quantiteSelectionnee > 0
                        ? `Déjà ${element.quantiteSelectionnee} personne, +${element.quantiteSuggeree} possible(s)`
                          : `${element.quantiteSuggeree} personne possible`}
                      </p>
                    </div>
                    {/* Prix masque cote client :
                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatAr(element.prix)}
                      </p>
                    */}
                  </div>

                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs leading-5 text-emerald-900/90">
                    {/* Prix masque cote client :
                      <p>
                        Prix par personne : <span className="font-semibold">{formatAr(element.prixParPersonne)}</span>
                      </p>
                    */}
                    <p>
                      Ajout suggere : <span className="font-semibold">{element.quantiteSuggeree}</span> personne
                    </p>
                    <p>
                      Suggestion : passer à{" "}
                      <span className="font-semibold">
                        {element.quantiteSelectionnee + element.quantiteSuggeree}
                      </span>{" "}
                      personne
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    onClick={() =>
                      void updateElementQuantity(
                        element.id,
                        element.quantiteSelectionnee + element.quantiteSuggeree
                      )
                    }
                  >
                    Ajouter {element.quantiteSuggeree} personne
                  </Button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-emerald-900/80">
              Vous pouvez augmenter directement le nombre de personnes sur un bloc propose.
            </p>
          </div>
        </DraggableSuggestionPanel>
      ) : null}
      <ImageGalleryDialog
        gallery={suggestionGallery}
        onChange={setSuggestionGallery}
        description="Images associees au bloc selectionne."
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
       

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Simulation budget voyage
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Configurez votre simulation
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Renseignez les informations principales pour lancer une estimation
                    adaptee a votre profil.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
                  Simple, rapide et modifiable a tout moment
                </div>
              </div>

              <div className="space-y-4">
                {!hasForfaitPrefill ? (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                    Choisissez d&apos;abord une destination puis un forfait depuis l&apos;accueil client ou la page details.
                    La simulation s&apos;ouvrira ensuite directement sur les profils voyageurs et le budget.
                  </div>
                ) : null}

                <CategoryGammeSelector
                  categories={categories}
                  profiles={voyageurProfiles}
                  onProfilesChange={setVoyageurProfiles}
                  disabled={loading}
                />

                <BudgetInput
                  value={budgetClient}
                  onChange={setBudgetClient}
                  minBudget={seuilMinimum}
                  adminBudget={budgetCategorieSelectionnee}
                  disabled={loading}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleLancerSimulation}
                  disabled={!canSimulate}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading
                    ? "Simulation en cours..."
                    : result
                      ? "Relancer la simulation"
                      : "Lancer la simulation"}
                </button>
                <button
                  onClick={resetSimulation}
                  disabled={loading && !result}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reinitialiser
                </button>
              </div>
            </section>

            {error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50/90 p-5 text-red-700 shadow-sm">
                <p className="text-sm font-semibold">Une erreur est survenue</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            ) : null}

            {result ? (
              <>
                <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                  <BudgetSummary
                    totalCoche={result.resume?.totalCoche || 0}
                    totalAvecMarge={totalFactureCorrige}
                    budgetClient={result.recap?.budgetClient || budgetClient}
                    adminBudget={budgetCategorieSelectionnee}
                    reste={resteBudgetCorrige}
                    totalOptionnel={result.resume?.totalOptionnel || 0}
                    seuilMinimum={result.recap?.seuilMinimum || 0}
                  />
                </section>

                {result.success ? (
                  <>
                    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                            Etape 2
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">
                            Ajustez votre planning
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Modifiez le nombre de personnes sur les blocs optionnels selon vos priorites.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {reservationEditPrefill.editReservationId ? (
                            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                              Mode modification de reservation
                            </div>
                          ) : null}
                          <Button
                            onClick={handleReserveSimulation}
                            disabled={!canReserveSimulation}
                            className="border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {reservationEditPrefill.editReservationId
                              ? "Mettre a jour depuis cette simulation"
                              : "Reserver cette simulation"}
                          </Button>
                        </div>
                      </div>

                      <ActionButtons
                        onToutCocher={toutCocher}
                        onToutDecocher={toutDecocher}
                      />
                    </section>

                      {result.jours ? (
                        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                              Etape 3
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">
                              Planning journalier recommandé
                            </h3>
                              <p className="mt-1 text-sm text-slate-600">
                                Visualisez votre voyage jour par jour, avec les blocs
                                obligatoires et optionnels.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Dialog open={isPlanningExpanded} onOpenChange={handlePlanningExpandedChange}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="icon" aria-label="Ouvrir le planning en grand ecran">
                                    <Expand className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent
                                  className="!max-h-[90vh] !w-[94vw] !max-w-[1400px] overflow-hidden rounded-[24px] border border-slate-200 bg-white p-0 sm:!max-w-[1400px]"
                                  onInteractOutside={(event) => {
                                    event.preventDefault();
                                  }}
                                  onEscapeKeyDown={(event) => {
                                    event.preventDefault();
                                  }}
                                >
                                  <DialogHeader className="border-b border-slate-200 bg-slate-50/90 px-5 py-3">
                                    <DialogTitle className="text-lg font-semibold text-slate-900">
                                      Planning journalier recommandé
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-600">
                                      Visualisez votre voyage en grand format et ajustez les blocs obligatoires et optionnels plus confortablement.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="max-h-[calc(90vh-74px)] overflow-auto px-5 py-3">
                                    <PlanningJournalier
                                      jours={result.jours}
                                      elementsSelectionnes={elementsSelectionnes}
                                      onChangeElementQuantity={updateElementQuantity}
                                      totalVoyageurs={totalVoyageurs(voyageurProfiles)}
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* <Button asChild variant="outline">
                                <Link href={`/${username}/reservations`}>Voir mes reservations</Link>
                              </Button> */}

                              
                            </div>
                          </div>

                        <PlanningJournalier
                          jours={result.jours}
                          elementsSelectionnes={elementsSelectionnes}
                          onChangeElementQuantity={updateElementQuantity}
                          totalVoyageurs={totalVoyageurs(voyageurProfiles)}
                        />
                      </section>
                    ) : null}
                  </>
                ) : null}

                <section
                  className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${
                    result.success && resteBudgetCorrige >= 0
                      ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
                      : "border-yellow-200 bg-yellow-50/95 text-yellow-800"
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {result.success && resteBudgetCorrige < 0
                      ? "Votre budget ne couvre pas le prix de vente agence pour tous les blocs sélectionnés."
                      : result.message}
                  </p>
                  {!result.success &&
                    result.suggestions?.suggestions.map((suggestion, index) => (
                      <p key={`${suggestion.type}-${index}`} className="mt-2 text-sm leading-6">
                        {suggestion.message}
                      </p>
                    ))}
                </section>
              </>
            ) : (

              
              <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                {/* <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      1. Choisissez
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Destination, forfait, categorie et gamme.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      2. Ajustez
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Indiquez votre budget et le nombre de voyageurs.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      3. Decidez
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Activez les options qui vous donnent le meilleur voyage.
                    </p>
                  </div>
                </div> */}

                {query?.get("planificationId") ? (
                  <p className="mt-4 text-sm text-emerald-700">
                    Une planification a ete preselectionnee depuis votre parcours precedent.
                  </p>
                ) : null}
              </section>
            )}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Vue rapide
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Votre cap budgetaire
              </h2>

              {/* <p className="mt-2 text-sm leading-6 text-slate-600">
                Cette colonne vous aide a garder une vision simple de votre marge de
                manoeuvre avant et apres simulation.
              </p> */}

              <div className="mt-4 space-y-2.5">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Budget min
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {seuilMinimum > 0 ? formatAr(seuilMinimum) : "A calculer"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Budget max
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {budgetCategorieSelectionnee ? formatAr(budgetCategorieSelectionnee) : "A choisir"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Votre budget
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {budgetClient > 0 ? formatAr(budgetClient) : "Non renseigne"}
                  </p>
                </div>
                  <div
                    className={`rounded-[20px] border p-3 ${
                      result
                        ? resteBudgetCorrige >= 0
                          ? "border-emerald-200 bg-emerald-50/80"
                        : "border-amber-200 bg-amber-50/80"
                      : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Reste budgetaire
                    </p>
                    <p
                      className={`mt-1.5 text-base font-semibold ${
                        result
                          ? resteBudgetCorrige >= 0
                            ? "text-emerald-800"
                          : "text-amber-800"
                        : "text-slate-900"
                    }`}
                  >
                    {result ? formatAr(resteBudgetCorrige) : "A calculer"}
                  </p>
                </div>
              </div>
            </section>

              {/* <section className="rounded-[24px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_20px_65px_-40px_rgba(15,23,42,0.95)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Conseil pro
                </p>
                <h3 className="mt-3 text-lg font-semibold">
                  Commencez par le coeur du voyage.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Lancez d&apos;abord une simulation avec les blocs essentiels, puis
                  ajoutez progressivement les options qui augmentent la valeur de
                  l&apos;experience.
              </p>
            </section> */}
          </aside>
        </div>
      </div>
    </div>
  );
}
