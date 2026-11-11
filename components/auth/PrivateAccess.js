"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { isPrivatePath } from "@/lib/access.js";
import { Button } from "@/components/ui/Button.js";

const subscribe = () => () => {};

export function PrivateAccess({ children }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { t } = useLang();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (!hydrated) return <p role="status" className="p-8 text-muted">{t("common.loading")}</p>;
  if (!isPrivatePath(pathname)) return children;
  if (isLoading) return <p role="status" className="p-8 text-muted">{t("common.loading")}</p>;
  if (user) return children;
  return <section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6 sm:p-10">
    <h1 className="text-2xl font-semibold text-content">{t("access.title")}</h1>
    <p className="my-4 leading-relaxed text-muted">{t("access.body")}</p>
    <div className="flex flex-wrap gap-3">
      <Button href={`/login?redirect=${encodeURIComponent(pathname)}`}>{t("auth.login")}</Button>
      <Button href="/crop-rotation" variant="outline">{t("access.demo")}</Button>
    </div>
  </section>;
}
