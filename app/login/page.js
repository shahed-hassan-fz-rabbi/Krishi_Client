"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { Button } from "@/components/ui/Button.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { fetchGoogleAuthStatus, getGoogleAuthEndpoint } from "@/services/api.js";
import { parseAuthContact } from "@/lib/authContact.js";
import { safeReturnTo, AUTH_RETURN_KEY } from "@/lib/access.js";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("redirect"));
  const { t } = useLang();
  const { login } = useAuth();
  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");
  const queryNoticeKey = `${errorParam || ""}:${messageParam || ""}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState("");
  const [dismissedQueryNotice, setDismissedQueryNotice] = useState("");
  const [dismissedQueryError, setDismissedQueryError] = useState("");

  const isRawGoogleError = messageParam && (messageParam.includes("failed") || messageParam.includes("reason:") || messageParam.includes("EACCES") || messageParam.includes("ECONNREFUSED"));
  const cleanGoogleError = isRawGoogleError 
    ? (t("auth.googleAuthFailed") || "Google sign-in was unable to connect. Please try again or sign in with email/password.")
    : (messageParam || t("auth.googleAuthFailed") || "Google sign-in failed. Please try again.");

  const queryError = (errorParam === "google_failed" || errorParam === "state_mismatch") && dismissedQueryError !== queryNoticeKey
    ? cleanGoogleError
    : "";
  const displayedError = error || queryError;
  const queryNotice = errorParam === "cancelled" && dismissedQueryNotice !== queryNoticeKey
    ? t("auth.googleAuthCancelled") || "Google sign-in was cancelled."
    : "";
  const displayedGoogleNotice = queryNotice || googleNotice;

  // Inspect query params for redirect errors from Google OAuth and verify live configuration
  useEffect(() => {
    let active = true;
    if (errorParam === "google_not_configured") {
      // Re-verify against live backend so stale URL params don't show a false warning
      fetchGoogleAuthStatus()
        .then((res) => {
          if (active && (!res?.success || !res?.data?.configured)) {
            setGoogleNotice(t("auth.googleNotConfigured"));
          } else if (active) {
            setGoogleNotice("");
          }
        })
        .catch(() => {
          if (active) setGoogleNotice(t("auth.googleNotConfigured"));
        });
    } else if (!errorParam) {
      // Passive live status check on mount to ensure warning is suppressed when configured
      fetchGoogleAuthStatus()
        .then((res) => {
          if (active && res?.success && res?.data?.configured) {
            setGoogleNotice("");
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [errorParam, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDismissedQueryError(queryNoticeKey);
    setGoogleNotice("");

    if (!email || !password) {
      setError(t("auth.fillAllFields"));
      return;
    }

    if (!parseAuthContact(email)) {
      setError(t("auth.invalidContact"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({ email: email.trim(), identifier: email.trim(), password });
      if (res.success) {
        router.push(returnTo);
      } else {
        setError(res.error || "Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setError("");
    setGoogleNotice("");
    setIsGoogleLoading(true);

    try {
      const statusRes = await fetchGoogleAuthStatus();
      if (statusRes.success && statusRes.data?.configured) {
        // Redirect directly to backend OAuth initiator
        try { sessionStorage.setItem(AUTH_RETURN_KEY, returnTo); } catch { /* Storage is optional. */ }
        window.location.href = getGoogleAuthEndpoint();
      } else {
        setIsGoogleLoading(false);
        setGoogleNotice(t("auth.googleNotConfigured"));
      }
    } catch {
      setIsGoogleLoading(false);
      setGoogleNotice(t("auth.googleNotConfigured"));
    }
  };

  return (
    <div className="relative h-full w-full bg-surface p-6 sm:p-8 lg:px-12 lg:py-9 flex flex-col justify-center">
      {/* Top Section: Back Link & Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-emerald transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("auth.backToHome")}</span>
          </Link>
        </div>

        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
            {t("auth.loginTitle")}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{t("auth.loginSubtitle")}</p>
        </div>

        {displayedError && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl bg-danger/10 border border-danger/20 p-3.5 text-xs text-danger"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{displayedError}</span>
            <button
              type="button"
              onClick={() => {
                setError("");
                setDismissedQueryError(queryNoticeKey);
              }}
              className="text-danger hover:opacity-75 p-0.5 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {displayedGoogleNotice && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl bg-surface-2 border border-line p-3.5 text-xs text-muted"
            role="status"
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald" />
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold text-content text-xs mb-0.5">Google Sign-In Notice</p>
              <p className="text-[11px]">{displayedGoogleNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (queryNotice) setDismissedQueryNotice(queryNoticeKey);
                setGoogleNotice("");
              }}
              className="text-muted hover:text-content p-0.5 transition-colors"
              aria-label="Dismiss notice"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-contact" className="block text-xs font-semibold text-content mb-1.5">
              {t("auth.contactLabel")}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
              <input
                id="login-contact" type="text" autoCapitalize="none" spellCheck={false} autoComplete="username"
                required
                placeholder={t("auth.contactPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface pl-10 pr-3 py-2.5 text-sm text-content placeholder:text-muted/60 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-content">
                {t("auth.passwordLabel")}
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
              <input
                id="login-password" autoComplete="current-password" type={showPassword ? "text" : "password"}
                required
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface pl-10 pr-10 py-2.5 text-sm text-content placeholder:text-muted/60 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 text-muted hover:text-content transition-colors focus:outline-none p-1"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2 bg-emerald hover:bg-emerald-600 text-white font-medium shadow-xs min-h-[44px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                <span>{t("auth.loggingIn")}</span>
              </>
            ) : (
              <>
                <span>{t("auth.loginButton")}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2.5 text-muted tracking-wider text-[11px]">
              {t("auth.orContinueWith")}
            </span>
          </div>
        </div>

        {/* Continue with Google button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-line bg-surface hover:bg-surface-2 transition-colors px-4 py-2.5 text-sm font-medium text-content focus:outline-none focus:ring-2 focus:ring-emerald/40 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs min-h-[44px]"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-emerald" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{t("auth.continueWithGoogle")}</span>
            </>
          )}
        </button>


      </div>

      {/* Bottom Footer Section */}
      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link
          href={`/register?redirect=${encodeURIComponent(returnTo)}`}
          className="font-semibold text-emerald hover:text-emerald-700 underline-offset-2 hover:underline"
        >
          {t("auth.register")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="relative isolate flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-14">
        {/* Subtle, premium atmospheric background */}
        <Image
          src="/images/auth-farmer.png"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover object-center opacity-20 dark:opacity-15 filter blur-[1px]"
          priority
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#021d13]/90 via-[#03261a]/85 to-[#01140e]/95" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />

        <div className="w-full max-w-lg">
          <div className="overflow-hidden rounded-3xl border border-line bg-surface/95 dark:bg-surface/95 shadow-2xl backdrop-blur-md">
            <Suspense
              fallback={
                <div className="h-full rounded-3xl border border-line bg-surface p-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
