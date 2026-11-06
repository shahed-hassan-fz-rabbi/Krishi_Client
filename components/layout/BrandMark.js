"use client";

import { useState } from "react";
import Link from "next/link";

export function BrandMark({ href = "/", tone = "dark", compact = false }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-base text-white">
        কৃ
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-base font-semibold text-inherit">Krishi Mama</span>
          <span className={tone === "dark" ? "block text-[11px] text-sidebar-muted" : "block text-[11px] text-muted"}>
            Climate Intelligence
          </span>
        </span>
      ) : null}
    </Link>
  );
}
