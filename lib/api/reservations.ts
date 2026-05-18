import { API_BASE_URL } from "@/lib/api";
import { apiRequest, ApiEnvelope, ApiError } from "@/lib/api/client";
import {
  Reservation,
  ReservationCreatePayload,
  PaginatedReservations,
  ReservationQuote,
  ReservationSource,
  ReservationStatus,
  ReservationStatusUpdatePayload,
} from "@/lib/type/reservation";

export function listMyReservations(token?: string) {
  return apiRequest<ApiEnvelope<Reservation[]>>("/api/reservations/my", {
    token,
  });
}

export function listAdminReservations(token?: string, status?: ReservationStatus | "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<ApiEnvelope<Reservation[]>>(`/api/reservations${query}`, {
    token,
  });
}

export type AdminReservationPageParams = {
  planificationId?: string;
  search?: string;
  status?: ReservationStatus | "ALL";
  source?: ReservationSource | "ALL";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  page?: number;
  size?: number;
};

export function listAdminReservationsPage(params: AdminReservationPageParams, token?: string) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "ALL") return;
    query.set(key, String(value));
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ApiEnvelope<PaginatedReservations>>(`/api/reservations/page${suffix}`, {
    token,
  });
}

export function getReservationById(id: string, token?: string) {
  return apiRequest<ApiEnvelope<Reservation>>(`/api/reservations/${id}`, {
    token,
  });
}

export async function downloadReservationPdf(id: string, token?: string) {
  const response = await fetch(`${API_BASE_URL}/api/reservations/${id}/document`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = "Impossible de telecharger le PDF de la reservation.";
    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || message;
    } catch {
      const text = await response.text();
      message = text || message;
    }
    throw new ApiError(message, response.status, null);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  const baseFilename = filenameMatch?.[1] || `reservation-${id}.pdf`;
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-");
  const filename = baseFilename.replace(/\.pdf$/i, `-${timestamp}.pdf`);

  return { blob, filename };
}

export function calculateReservationQuote(payload: ReservationCreatePayload, token?: string) {
  return apiRequest<ApiEnvelope<ReservationQuote>>("/api/reservations/quote", {
    method: "POST",
    token,
    body: payload,
  });
}

export function createReservationFromPrice(payload: ReservationCreatePayload, token?: string) {
  return apiRequest<ApiEnvelope<Reservation>>("/api/reservations/from-price", {
    method: "POST",
    token,
    body: payload,
  });
}

export function createReservationFromSimulation(payload: ReservationCreatePayload, token?: string) {
  return apiRequest<ApiEnvelope<Reservation>>("/api/reservations/from-simulation", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateMyReservation(
  id: string,
  payload: ReservationCreatePayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<Reservation>>(`/api/reservations/${id}/client`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteMyReservation(id: string, token?: string) {
  return apiRequest<ApiEnvelope<null>>(`/api/reservations/${id}/client`, {
    method: "DELETE",
    token,
  });
}

export function updateReservationStatus(
  id: string,
  payload: ReservationStatusUpdatePayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<Reservation>>(`/api/reservations/${id}/status`, {
    method: "PUT",
    token,
    body: payload,
  });
}
