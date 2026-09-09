import type { Metadata, Viewport } from "next";
import "@/lib/suppress-script-warning";
import DevChunkErrorRecovery from "@/components/DevChunkErrorRecovery";
import DevServiceWorkerReset from "@/components/DevServiceWorkerReset";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { rokhFont } from "@/lib/font";
import { ReactQueryProvider } from "@/lib/api/client";
import "./globals.css";
import ConditionalShell from "@/components/ConditionalShell";

export const metadata: Metadata = {
  title: {
    default: "رایا | وب‌اپلیکیشن",
    template: "%s | رایا",
  },
  description: "اپلیکیشن جامع رایا برای دانشجویان",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "رایا",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#15171c" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${rokhFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-(--background) text-(--foreground)"
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          {process.env.NODE_ENV === "development" && (
            <>
              <DevChunkErrorRecovery />
              <DevServiceWorkerReset />
            </>
          )}
          <ServiceWorkerRegister />
          <ConditionalShell>{children}</ConditionalShell>
        </ReactQueryProvider>
      </body>
    </html>
  );
}