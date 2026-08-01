"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInButton({ redirectTo }: { redirectTo: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setIsLoading(true);
    setError("");

    try {
      await signIn("muhammadiyah", { redirectTo });
    } catch {
      setError("Tidak dapat terhubung ke Muhammadiyah ID. Silakan coba lagi.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="ui-button ui-button-primary w-full"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4 7a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" />
        </svg>
        {isLoading ? "Menghubungkan..." : "Masuk dengan Muhammadiyah ID"}
      </button>
      {error && <p className="mt-3 text-center text-[11px] text-[#d92d20]" role="alert">{error}</p>}
    </div>
  );
}
