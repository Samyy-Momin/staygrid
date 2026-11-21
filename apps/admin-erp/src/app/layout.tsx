import type { Metadata } from"next";
import { Inter } from"next/font/google";
import"./globals.css";
import { ThemeProvider } from"@/components/theme-provider";
import { Providers } from"./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
 title:"StayGrid ERP",
 description:"Enterprise Resource Planning for StayGrid",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning>
 <body className={`${inter.className} text-primary bg-surface dark:bg-black dark:text-primary antialiased`}>
 <ThemeProvider defaultTheme="system">
 <Providers>
 {children}
 </Providers>
 </ThemeProvider>
 </body>
 </html>
 );
}
