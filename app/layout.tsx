import { ConvexClientProvider } from "@/providers/ConvexProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ModalProvider } from "@/providers/ModalProvider";
import { EdgeStoreProvider } from "@/lib/edgestore";

const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata for the website.
 */
export const metadata: Metadata = {
  title: "Joker Notes",
  description: "Organise notes cleanly and efficiently.",
};

/**
 * The root layout for the website.
 * The entire website is wrapped in this layout meaning that it will follow this layout.
 * This includesL:
 * - The structure of the website unless it is overridden by a sub-layout component
 * - Any providers will be available to the entire website
 * @param children (React.ReactNode) The children to render to follow the layout.
 * @returns (React.ReactNode) The layout for the website
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
