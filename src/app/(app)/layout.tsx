"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { AppStateProvider } from "@/state/AppStateContext";
import { Button } from "@/components/ui/button";
import { doSignOut } from "@/app/firebase/auth";
const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/groups", label: "Groups" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await doSignOut(); // Firebase session cleared
      router.replace("/login"); // UI redirect
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppStateProvider>
      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 border-r p-4 flex flex-col">
          <div className="mb-6 text-xl font-semibold">Calendar App</div>
          <nav className="space-y-2 flex-1">
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
          <div className="mt-auto">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
        <Toaster />
      </div>
    </AppStateProvider>
  );
}
