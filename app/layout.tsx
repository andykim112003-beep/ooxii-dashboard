import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OOXii Dashboard",
  description: "OOXii Tester Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#2d2f6e', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}