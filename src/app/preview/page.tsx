import type { Metadata } from "next";
import { FullPreview } from "@/components/FullPreview";
export const metadata: Metadata = {
  title: "Full preview",
  robots: { index: false, follow: false },
};
export default function PreviewPage() {
  return <FullPreview />;
}
