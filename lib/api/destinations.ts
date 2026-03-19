import { apiRequest } from "@/lib/api/client";
import { DestinationDetails } from "@/lib/type/destination";

type DestinationApiResponse =
  | DestinationDetails[]
  | DestinationDetails
  | { data?: DestinationDetails[] | DestinationDetails };

function toArray(value: DestinationApiResponse): DestinationDetails[] {
  if (Array.isArray(value)) {
    return value;
  }

  if ("data" in value && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
}

function toItem(value: DestinationApiResponse): DestinationDetails | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if ("data" in value) {
    if (Array.isArray(value.data)) {
      return value.data[0] ?? null;
    }

    return value.data ?? null;
  }

  return value;
}

export async function listDestinations() {
  const response = await apiRequest<DestinationApiResponse>("/api/destinations");
  return toArray(response);
}

export async function getDestinationById(id: string) {
  const response = await apiRequest<DestinationApiResponse>(`/api/destinations/${id}`);
  return toItem(response);
}
