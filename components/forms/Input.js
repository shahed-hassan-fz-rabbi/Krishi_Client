"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Input({ label, type = "text", placeholder, required = false, value, onChange, className = "", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-content">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-content placeholder:text-muted focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-content"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
