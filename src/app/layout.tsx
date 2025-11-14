import "./globals.css";
import { AuthProvider } from "@/context/authContext";
export const metadata = {
  title: "Calendar Assistant",
  description: "Routing shell for dashboard / calendar / groups / AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
