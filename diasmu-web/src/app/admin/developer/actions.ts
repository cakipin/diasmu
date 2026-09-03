"use server";

import { apiUrl, jsonAuthHeaders } from "@/lib/security";
import { revalidatePath } from "next/cache";

export async function createClientAction(
  appName: string,
  redirectUris: string,
  allowLocalhost: boolean,
  createdBy: string,
  environment: "production" | "staging" = "production"
) {
  const res = await fetch(apiUrl("/api/developer/clients"), {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify({
      app_name: appName,
      redirect_uris: redirectUris,
      allow_localhost: allowLocalhost,
      created_by: createdBy,
      environment,
    }),
  });
  const data = await res.json();
  revalidatePath("/admin/developer");
  return data;
}

export async function deleteClientAction(id: number) {
  const res = await fetch(apiUrl(`/api/developer/clients/${id}`), {
    method: "DELETE",
    headers: jsonAuthHeaders(),
  });
  revalidatePath("/admin/developer");
  return await res.json();
}

export async function updateClientAction(
  id: number,
  appName: string,
  redirectUris: string,
  allowLocalhost: boolean,
  environment: "production" | "staging" = "production"
) {
  const res = await fetch(apiUrl(`/api/developer/clients/${id}`), {
    method: "PUT",
    headers: jsonAuthHeaders(),
    body: JSON.stringify({
      app_name: appName,
      redirect_uris: redirectUris,
      allow_localhost: allowLocalhost,
      environment,
    }),
  });
  revalidatePath("/admin/developer");
  return await res.json();
}
