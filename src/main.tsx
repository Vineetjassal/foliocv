import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getRouter } from "./router";
import { dismissLoader } from "./lib/loader";
import "./styles.css";

const queryClient = new QueryClient();
const router = getRouter();

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={router}
        // Dismiss the loader once the first route has rendered
        defaultOnCatch={() => dismissLoader()}
      />
    </QueryClientProvider>
  </StrictMode>,
);

// Fallback: dismiss after React finishes its first paint
requestAnimationFrame(() => requestAnimationFrame(() => dismissLoader()));
