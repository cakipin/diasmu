import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuthorizeClient from "./AuthorizeClient";

export const runtime = "edge";

const WORKER_URL = "https://diasmu.labmu.workers.dev";

type OAuthClient = {
  client_id: string;
  app_name: string;
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AuthorizePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const client_id = (params.client_id as string) || '';
  const redirect_uri = (params.redirect_uri as string) || '';
  const response_type = (params.response_type as string) || '';
  const state = (params.state as string) || '';

  // Validasi parameter dasar
  if (!client_id || !redirect_uri || response_type !== 'code') {
    return (
      <div className="min-h-screen bg-[#001a35] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Parameter Tidak Valid</h1>
          <p className="text-slate-500 text-sm mb-6">
            Request OAuth harus menyertakan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold">client_id</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold">redirect_uri</code>, dan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold">response_type=code</code>.
          </p>
        </div>
      </div>
    );
  }

  // Cek session
  const session = await auth();

  if (!session?.user?.email) {
    const callbackPath = '/oauth/authorize?' + new URLSearchParams({ client_id, redirect_uri, response_type: 'code', state }).toString();
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  // Validasi client_id — langsung pakai fetch ke Worker tanpa getInternalSecret
  let clientApp: OAuthClient | undefined;
  let fetchError = '';
  try {
    const token = process.env.DIASMU_SECRET_TOKEN || '';
    const res = await fetch(`${WORKER_URL}/api/developer/clients`, {
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const clients = await res.json() as OAuthClient[];
      clientApp = clients.find((client) => client.client_id === client_id);
    } else {
      const errBody = await res.text();
      fetchError = `API ${res.status}: ${errBody}`;
    }
  } catch (error: unknown) {
    fetchError = error instanceof Error ? error.message : 'Network error';
  }

  if (!clientApp) {
    return (
      <div className="min-h-screen bg-[#001a35] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Aplikasi Tidak Dikenali</h1>
          <p className="text-slate-500 text-sm">
            Client ID <code className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold">{client_id}</code> tidak terdaftar di DiasMu.
          </p>
          {fetchError && (
            <p className="text-red-400 text-xs mt-4 bg-red-50 p-3 rounded-xl break-all">
              Debug: {fetchError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthorizeClient
      appName={clientApp.app_name}
      clientId={client_id}
      redirectUri={redirect_uri}
      state={state}
      userName={session.user.name || 'Pengguna'}
      userEmail={session.user.email}
      userNbm={session.user.nbm || ''}
      userImage={session.user.image}
    />
  );
}
