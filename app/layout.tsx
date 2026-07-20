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
      <body style={{ margin: 0, padding: 0, background: '#2d2f6e', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: '#2d2f6e' }}>
          {children}
        </div>
      </body>
    </html>
  );
}