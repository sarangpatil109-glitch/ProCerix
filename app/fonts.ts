import { Inter, Outfit } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});
