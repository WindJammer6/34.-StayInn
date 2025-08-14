import React from "react";
import clsx from "clsx";

export const Card = ({ children, className = "", "data-testid": testId }) => (
  <div
    className={clsx(
      "bg-white rounded-xl shadow-sm border border-gray-200",
      className
    )}
    data-testid={testId}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={clsx("p-4 border-b border-gray-200", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "" }) => (
  <h2 className={clsx("text-lg font-semibold", className)}>{children}</h2>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={clsx("p-4", className)}>{children}</div>
);