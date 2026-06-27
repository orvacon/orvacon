"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav } from "@/config/docs";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r md:block">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        {docsNav.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) =>
                item.soon ? (
                  <li
                    key={item.href}
                    className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/60"
                  >
                    {item.title}
                    <span className="rounded bg-muted px-1.5 py-px text-[10px]">soon</span>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
