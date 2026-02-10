import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Second Brain — Embeddable Widget",
  description: "Search and query a Second Brain knowledge base.",
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
