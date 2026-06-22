import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This page drifted off the grid.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Something broke.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

/** Global dark-mode provider — reads/writes localStorage and sets class on <html> */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("foliocv_theme") as "dark" | "light" | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("foliocv_theme", theme);
  }, [theme]);

  // Expose toggle via a custom event so any component can call it
  useEffect(() => {
    const handler = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    window.addEventListener("foliocv:toggle-theme", handler);
    return () => window.removeEventListener("foliocv:toggle-theme", handler);
  }, []);

  return <>{children}</>;
}

/** Call this from any component to toggle the app-level theme */
export function toggleAppTheme() {
  window.dispatchEvent(new Event("foliocv:toggle-theme"));
}

/** Hook to read current app theme */
export function useAppTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("foliocv_theme") as "dark" | "light") ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });
  useEffect(() => {
    const handler = () => {
      setTheme((localStorage.getItem("foliocv_theme") as "dark" | "light") ?? "dark");
    };
    window.addEventListener("foliocv:toggle-theme", handler);
    return () => window.removeEventListener("foliocv:toggle-theme", handler);
  }, []);
  return theme;
}

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <Outlet />
      <Analytics />
    </ThemeProvider>
  ),
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
