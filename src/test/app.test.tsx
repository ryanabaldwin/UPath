import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { DemoIdentityProvider } from "@/contexts/DemoIdentityContext";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

function renderWithProviders(
  ui: React.ReactElement,
  { route = "/" }: { route?: string } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderAppWithIdentity(ui: React.ReactElement, { route = "/" }: { route?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DemoIdentityProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </DemoIdentityProvider>
    </QueryClientProvider>
  );
}

describe("Landing", () => {
  it("shows hero heading and CTA", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByRole("heading", { name: /find your path/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to my dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore careers first/i })).toBeInTheDocument();
  });
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ));
    if (typeof window.localStorage?.clear === "function") {
      window.localStorage.clear();
    }
  });

  it("shows prompt to select profile when no users", async () => {
    renderAppWithIdentity(<Dashboard />, { route: "/dashboard" });
    expect(await screen.findByText(/select a demo profile/i)).toBeInTheDocument();
  });
});
