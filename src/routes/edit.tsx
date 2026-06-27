import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/edit")({
  component: EditPage,
});

function EditPage() {
  const navigate = useNavigate();

  // Redirect to /create if no CV data exists in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("foliocv_data");
    if (!saved) {
      navigate({ to: "/create" });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Edit your CV</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is coming soon. Go back to create or view your CV.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a
            href="/create"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Create CV
          </a>
          <a
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
