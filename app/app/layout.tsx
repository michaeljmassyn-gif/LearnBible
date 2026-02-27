import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import "@fontsource-variable/nunito"
import "./globals.css"

export const metadata: Metadata = {
  title: "LearnBible",
  description: "Gamified Bible learning for youth",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LearnBible",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e2130",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.21 0.012 240)",
              color: "oklch(0.97 0 0)",
              border: "1px solid oklch(1 0 0 / 10%)",
              fontFamily: '"Nunito Variable", "Nunito", sans-serif',
              fontWeight: "600",
            },
          }}
        />
      </body>
    </html>
  )
}
