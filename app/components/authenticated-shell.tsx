"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CreditCard, KeyRound, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser-client";
import { Logo } from "@/app/components/logo";

type AuthenticatedShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { name: "API Keys", href: "/keys", icon: KeyRound },
  { name: "New Intake", href: "/intake", icon: KeyRound, hide: true }, // still routable, but not in nav
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings }
].filter((item) => !item.hide);

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleExit() {
    try {
      const supabase = getBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out errors in local dev mode.
    }
    router.push("/auth/signin");
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/dashboard">
          <Logo size={40} />
          <span>API Spend Guard</span>
        </Link>
        <nav className="topnav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={isActive ? "active" : ""}>
                <Icon size={15} strokeWidth={2.2} />
                {item.name}
              </Link>
            );
          })}
          <div style={{ width: 2, height: 28, background: "rgba(10,42,63,0.18)", margin: "0 4px" }} />
          <button type="button" className="button-secondary" onClick={handleExit}>
            <LogOut size={15} strokeWidth={2.2} />
            Exit
          </button>
        </nav>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
