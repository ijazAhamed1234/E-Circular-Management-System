import "../styles/index.css";
import { AppProvider } from "../lib/context/AppContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-Circular Management System",
  description: "Sending E-Circular with digital signature",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
