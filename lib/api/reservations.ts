import { apiRequest, ApiEnvelope } from "@/lib/api/client";
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
