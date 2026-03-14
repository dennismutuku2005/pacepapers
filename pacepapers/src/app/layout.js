import { Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
});

export const metadata = {
  title: "PacePapers | Smart Receipt Generator",
  description: "Fast and professional invoice and receipt generation for Pace Wisp.",
  icons: {
    icon: '/logo.png',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body className="antialiased font-figtree transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Toaster position="top-right" richColors closeButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
