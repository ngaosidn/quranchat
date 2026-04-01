import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import { metadata, viewport } from './metadata';
import { Inter, Amiri } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-amiri",
});

export { metadata, viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.className} ${amiri.variable}`}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
