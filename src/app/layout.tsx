import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Torretas from "@/models/edificios";

/* console.log(Torretas.getCollection ({name})) */
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
/*  */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className=" bg-slate-400">
      <body className={inter.className}>{children}</body>
    </html>
  );
}