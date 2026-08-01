"use client";

import { useState } from "react";

interface HeaderProps {
  title: string;
  userName: string;
  userNbm: string;
  userImage: string;
}

export default function HeaderPemohon({ title, userName, userNbm, userImage }: HeaderProps) {
  const [imgError, setImgError] = useState(false);
  const hasValidImage = Boolean(userImage && userImage.trim() !== "");

  return (
    <header className="ui-topbar sticky top-0 z-30">
      <div>
        <h1>{title}</h1>
        <p className="md:hidden">Dashboard PIC DiasMu</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <strong className="block text-[11px] font-semibold text-[#172033]">{userName}</strong>
          <small className="text-[10px] text-[#667085]">NBM {userNbm || "belum terdaftar"}</small>
        </div>

        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-[8px] bg-[#eaf2ff] text-xs font-bold text-[#1265e5]">
          {hasValidImage && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={userImage}
              alt={userName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{userName?.charAt(0) || "U"}</span>
          )}
        </div>
      </div>
    </header>
  );
}
