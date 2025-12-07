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
  //{ href: "/ai-assistant", label: "AI Assistant" },
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
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <aside className="w-64 shrink-0 border-r border-gray-700 bg-gray-800/90 backdrop-blur-sm p-6 flex flex-col shadow-lg">
          <div className="mb-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Grouply
            </div>
            <p className="mt-1 text-xs text-gray-400">Manage your schedule</p>
          </div>
          <nav className="space-y-1 flex-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  pathname === n.href
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-gray-700">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-700 text-gray-200"
            >
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-auto bg-gray-900">{children}</main>
        <Toaster />
      </div>
    </AppStateProvider>
  );
}
