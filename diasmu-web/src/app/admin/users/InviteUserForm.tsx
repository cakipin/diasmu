"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type InviteActionState = {
  success: boolean;
  message: string;
};

type InviteUserFormProps = { tone: "admin" | "pic" };

export default function InviteUserForm({ tone }: InviteUserFormProps) {
  const router = useRouter();
  const [state, setState] = useState<InviteActionState>({ success: false, message: "" });
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isAdmin = tone === "admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({ success: false, message: "" });

    const formData = new FormData(event.currentTarget);
    const nbm = String(formData.get("nbm") || "");

    try {
      const response = await fetch(`/api/admin/invite/${tone}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nbm }),
      });
      const result = await response.json() as InviteActionState;
      setState(result);

      if (response.ok && result.success) {
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      setState({ success: false, message: "Koneksi terputus saat memproses undangan." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`ui-invite-form ${isAdmin ? "ui-invite-form-admin" : "ui-invite-form-pic"}`}>
      <div className="ui-invite-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
        <input
          type="text"
          name="nbm"
          list="sso-list"
          required
          autoComplete="off"
          placeholder="Cari NBM dari riwayat SSO..."
          aria-label={isAdmin ? "NBM calon Super Admin" : "NBM calon PIC"}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`ui-invite-submit ${isAdmin ? "ui-invite-submit-admin" : "ui-invite-submit-pic"}`}
      >
        {pending ? "Memproses..." : isAdmin ? "Invite Super Admin" : "Invite PIC"}
      </button>
      {state.message && (
        <p className={`ui-invite-feedback ${state.success ? "is-success" : "is-error"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
