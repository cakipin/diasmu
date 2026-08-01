import { auth } from "@/auth";
import { apiUrl, authHeaders } from "@/lib/security";
import ClientPage from "./ClientPage";

export const runtime = "edge";

export default async function DeveloperPage() {
  const session = await auth();
  const userEmail = session?.user?.email || "Admin";

  let initialClients = [];
  try {
    const res = await fetch(apiUrl("/api/developer/clients"), {
      cache: "no-store",
      headers: authHeaders()
    });
    if (res.ok) {
      initialClients = await res.json();
    }
  } catch (error) {
    console.error("Gagal mengambil data clients:", error);
  }

  return <ClientPage initialClients={initialClients} userEmail={userEmail} />;
}
