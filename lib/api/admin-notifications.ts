import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import { AdminNotification, AdminNotificationList } from "@/lib/type/admin-notification";

export function listAdminNotifications(token?: string) {
  return apiRequest<ApiEnvelope<AdminNotificationList>>("/api/admin/notifications", {
    token,
  });
}

export function markAdminNotificationAsRead(id: string, token?: string) {
  return apiRequest<ApiEnvelope<AdminNotification>>(`/api/admin/notifications/${id}/read`, {
    method: "PUT",
    token,
  });
}

export function markAdminNotificationAsUnread(id: string, token?: string) {
  return apiRequest<ApiEnvelope<AdminNotification>>(`/api/admin/notifications/${id}/unread`, {
    method: "PUT",
    token,
  });
}

export function markAllAdminNotificationsAsRead(token?: string) {
  return apiRequest<ApiEnvelope<null>>("/api/admin/notifications/read-all", {
    method: "PUT",
    token,
  });
}

export function deleteAdminNotification(id: string, token?: string) {
  return apiRequest<ApiEnvelope<null>>(`/api/admin/notifications/${id}`, {
    method: "DELETE",
    token,
  });
}

export function deleteAllAdminNotifications(token?: string) {
  return apiRequest<ApiEnvelope<null>>("/api/admin/notifications", {
    method: "DELETE",
    token,
  });
}
