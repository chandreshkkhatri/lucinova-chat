"use client";

import { useEffect, useState } from "react";

import { ProfileModal } from "./profile-modal";

export function ProfileGate() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function check() {
      try {
        const res = await fetch("/api/user/profile-status", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (!ignore) {
          setOpen(Boolean(data.authenticated && data.needsProfile));
          setChecked(true);
        }
      } catch (_) {
        setChecked(true);
      }
    }
    check();
    return () => {
      ignore = true;
    };
  }, []);

  if (!checked) return null;

  return (
    <ProfileModal
      open={open}
      onClose={() => setOpen(false)}
      onSaved={() => setOpen(false)}
    />
  );
}
