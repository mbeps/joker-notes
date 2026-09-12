import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

/**
 * Static site metadata consumed by Next.js for `<head>` rendering.
 *
 * @returns Metadata describing the Joker Notes application.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 */
export const metadata: Metadata = {
  title: "Joker Notes",
  description: "Organise notes cleanly and efficiently.",
};

/**
 * Top-level app layout that wires essential providers and shared UI chrome.
 * Registers Convex, Edge Store, theme, and modal contexts for the entire tree.
 *
 * @param param0 Object containing children to render.
 * @param param0.children React subtree rendered inside the root layout.
 * @returns HTML scaffold with required global providers.
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} h-full`}>
        <ConvexClientProvider>
          <EdgeStoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              storageKey="motion-theme"
            >
              <Toaster />
              <ModalProvider />
              {children}
            </ThemeProvider>
          </EdgeStoreProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
