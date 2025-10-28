"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { AppStateProvider } from "@/state/AppStateContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/groups", label: "Groups" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AppStateProvider>
      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 border-r p-4">
          <div className="mb-6 text-xl font-semibold">Calendar App</div>
          <nav className="space-y-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`block rounded px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground ${
                  pathname === n.href ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
        <Toaster />
      </div>
    </AppStateProvider>
  );
}
