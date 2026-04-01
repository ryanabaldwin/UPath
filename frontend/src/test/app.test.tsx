import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "@/pages/Landing";
import Explore from "@/pages/Explore";
import CareerOverview from "@/pages/CareerOverview";
import { exploreCareerSections } from "@/data/mockData";

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

function renderAppWithAuth(ui: React.ReactElement, { route = "/" }: { route?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("Landing", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })) as unknown as typeof fetch
    );
  });

  it("shows hero heading and CTA", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <Landing />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(screen.getByRole("heading", { name: /your career path/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started — it's free/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("Explore career hub", () => {
  const userId = "1";

  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url.includes("/api/auth/me") && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            id: userId,
            username: "test.user",
            email: "test@test.com",
            firstName: "Test",
            lastName: "User",
            role: "student",
          }),
        };
      }
      if (url.includes("/milestones/tree") && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            tree: [],
            summary: {
              estimatedCompletionDate: null,
              estimatedTimeRemainingDays: null,
              planProgressPercent: 0,
              totalDailySteps: 0,
              completedDailySteps: 0,
              currentQuarter: null,
              quarterRollups: [],
            },
            has_active_generated_plan: false,
          }),
        };
      }
      if (url.match(/\/api\/users\/\d+$/) && method === "GET" && !url.includes("milestones")) {
        return {
          ok: true,
          json: async () => ({
            id: userId,
            user_first: "Test",
            user_last: "User",
            user_region: null,
            goal_id: null,
            user_img_src: null,
            goal_title: null,
            north_star_vision: null,
            definition_of_success: null,
            current_grade_level: null,
            streak_count: 0,
          }),
        };
      }
      return { ok: true, json: async () => [] };
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  });

  it("shows hero and Learn more links for all milestone-capable paths", async () => {
    renderAppWithAuth(<Explore />, { route: "/explore" });
    expect(await screen.findByRole("heading", { name: /explore your future/i })).toBeInTheDocument();

    const learnMoreLinks = screen.getAllByRole("link", { name: /^learn more$/i });
    expect(learnMoreLinks).toHaveLength(exploreCareerSections.length);
    const hrefs = learnMoreLinks.map((a) => a.getAttribute("href")).sort();
    expect(hrefs).toEqual(exploreCareerSections.map((s) => `/paths/${s.slug}`).sort());
  });

  it("renders Data Analytics overview at /paths/data-analytics", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/paths/data-analytics"]}>
            <Routes>
              <Route path="/paths/:slug" element={<CareerOverview />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(await screen.findByRole("heading", { name: /data analytics/i })).toBeInTheDocument();
    expect(screen.getByText(/turn raw information into clear answers/i)).toBeInTheDocument();
  });

  it("renders trades overview at canonical slug trades-technical", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/paths/trades-technical"]}>
            <Routes>
              <Route path="/paths/:slug" element={<CareerOverview />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(await screen.findByRole("heading", { name: /trades & technical skills/i })).toBeInTheDocument();
  });
});
