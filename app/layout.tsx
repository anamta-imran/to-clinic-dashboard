import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClinicDataProvider } from "@/components/providers/ClinicDataProvider";
import { SidebarProvider } from "@/components/providers/SidebarProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T.O. Clinic | AI Receptionist Dashboard",
  description:
    "Premium operations dashboard for T.O. Clinic, Orthopaedic and Trauma Clinic in Gulshan-e-Iqbal, Karachi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ClinicDataProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ClinicDataProvider>
      </body>
    </html>
  );
}
