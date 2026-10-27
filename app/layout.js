import "./globals.css";
import { IBM_Plex_Sans } from "next/font/google";
const font = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
export const metadata = { title: "Stockroom – Inventory & Invoicing" };
export default function RootLayout({ children }) {
  return (<html lang="en"><body className={font.className}>{children}</body></html>);
}
