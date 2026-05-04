import type { Metadata } from "next";
import { AuthConfigProvider } from "@/components/auth/auth-config-provider";
import { CartProvider } from "@/hooks/use-cart";
import { SiteConfigProvider } from "@/components/providers/site-config-provider";
import { DynamicHead } from "@/components/providers/dynamic-head";
import "./globals.css";

export const metadata: Metadata = {
  title: "mono-next",
  description: "Admin panel for managing application resources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-background text-foreground">
        <SiteConfigProvider>
          <DynamicHead />
          <AuthConfigProvider>
            <CartProvider>{children}</CartProvider>
          </AuthConfigProvider>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
