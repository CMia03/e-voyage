import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import {
  Reservation,
  ReservationCreatePayload,
  ReservationQuote,
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
