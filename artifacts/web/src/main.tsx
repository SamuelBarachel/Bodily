import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import "./index.css";
import App from "./App";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  const base = apiUrl.startsWith("http") ? apiUrl : `https://${apiUrl}`;
  setBaseUrl(base);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
