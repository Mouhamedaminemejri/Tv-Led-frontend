"use client";

import * as React from "react";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface LedsBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function LedsBreadcrumb({ items }: LedsBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 py-4 mb-2">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {idx === 0 && <Home className="h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px] sm:max-w-[320px]">
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
