"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browser-client";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = getBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/signin");
      } else {
        setAuthed(true);
      }
      setChecking(false);
    })();
  }, [router]);

  if (checking) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p className="hint">Verifying session…</p>
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
