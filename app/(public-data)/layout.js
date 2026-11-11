import { PublicDataLayout } from "@/components/layout/PublicDataLayout.js";

/** Public records always stay in the render tree; no auth/hydration gate. */
export default function PublicDataRouteLayout({ children }) {
  return <PublicDataLayout>{children}</PublicDataLayout>;
}
