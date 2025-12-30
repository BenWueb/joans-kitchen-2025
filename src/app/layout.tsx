import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Joan's Kitchen",
  description: "Joan's Kitchen is a recipe app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased min-h-screen bg-cover bg-no-repeat bg-center bg-fixed bg-[linear-gradient(to_top,rgba(0,0,0,0.8),rgba(0,0,0,0.95)),url('/images/bg.jpg')]`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
