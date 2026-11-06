"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { Input } from "@/components/forms/Input.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody } from "@/components/ui/Card.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

export default function LoginPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("auth.fillAllFields"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("auth.invalidEmail"));
      return;
    }

    setIsLoading(true);
    // Backend authentication will be implemented by another agent
    // This page structure is ready for integration
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              {t("auth.loginTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted">{t("auth.loginSubtitle")}</p>
          </div>

          <Card>
            <CardBody>
              {error && (
                <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label={t("auth.emailLabel")}
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label={t("auth.passwordLabel")}
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-climate hover:text-climate-strong"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? t("auth.loggingIn") : t("auth.loginButton")}
                  {!isLoading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-muted">{t("auth.orContinueWith")}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t("auth.continueWithGoogle")}
              </Button>

              <p className="mt-6 text-center text-sm text-muted">
                {t("auth.noAccount")}{" "}
                <Link href="/register" className="font-medium text-climate hover:text-climate-strong">
                  {t("auth.register")}
                </Link>
              </p>
            </CardBody>
          </Card>

          <p className="mt-6 text-center text-xs text-muted">
            {t("auth.backendNote")}
          </p>
        </div>
      </main>
    </div>
  );
}
