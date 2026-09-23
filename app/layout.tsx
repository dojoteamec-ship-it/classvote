import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassVote — RoninX Academy",
  description: "Vota el tema de la próxima clase Mondo de tu cinturón.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
