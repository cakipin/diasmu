"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PicStatusSwitchProps = {
  nbm: string;
  name: string;
  initialActive: boolean;
};

export default function PicStatusSwitch({ nbm, name, initialActive }: PicStatusSwitchProps) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleStatus() {
    if (isPending) return;

    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/pics/${encodeURIComponent(nbm)}/toggle`, {
          method: "PUT",
        });
        const result = await response.json() as { success?: boolean; status?: string; message?: string };

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Status PIC gagal diperbarui.");
        }

        setActive(result.status === "approved");
        setMessage("Status PIC berhasil diperbarui.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Status PIC gagal diperbarui.");
      }
    });
  }

  const actionLabel = `${active ? "Nonaktifkan" : "Aktifkan"} ${name}`;

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={actionLabel}
        aria-busy={isPending}
        className="ui-switch"
        disabled={isPending}
        onClick={toggleStatus}
        title={active ? "Nonaktifkan PIC" : "Aktifkan PIC"}
      >
        <span />
      </button>
      <span className="sr-only" aria-live="polite">{message}</span>
    </>
  );
}
