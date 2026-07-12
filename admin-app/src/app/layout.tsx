import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/AuthProvider";
import { UIProvider } from "@/components/ui/UIProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luban Workshop Admin",
  description: "Operations dashboard for Luban Workshop Restaurant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UIProvider>
          <AuthProvider>{children}</AuthProvider>
        </UIProvider>
      </body>
    </html>
  );
}
