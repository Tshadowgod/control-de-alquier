import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Control de alquileres",
  description: "Alquileres, cobros mensuales y consumo eléctrico por inquilino",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
          <aside className="no-print border-b border-borde bg-panel px-4 py-4 lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
            <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca text-sm font-bold text-white">
                A
              </span>
              <span className="text-sm leading-tight font-semibold text-tinta">
                Control de
                <br />
                alquileres
              </span>
            </Link>
            <Nav />
          </aside>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
