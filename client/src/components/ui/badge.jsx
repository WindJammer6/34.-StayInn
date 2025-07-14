import React from "react";

export function Badge({ children, variant = "default", className = "" }) {
  const baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold transition-colors";
  const variants = {
    default: "bg-blue-600 text-white",
    outline: "border border-gray-400 text-gray-700 bg-transparent",
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`${baseClasses} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
