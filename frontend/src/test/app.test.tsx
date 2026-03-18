import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { DemoIdentityProvider } from "@/contexts/DemoIdentityContext";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";

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

describe("Explore AI coach", () => {
  const userId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url.endsWith("/api/users") && method === "GET") {
        return { ok: true, json: async () => [{ id: userId, user_first: "A", user_last: "B" }] };
      }
      if (url.includes(`/api/users/${userId}/preferences`) && method === "GET") {
        return { ok: true, json: async () => ({ user_id: userId, interests: null, selected_career_paths: [] }) };
      }
      if (url.includes(`/api/users/${userId}/profile`) && method === "GET") {
        return { ok: true, json: async () => ({ profile_json: {}, completeness: 0, thread_id: null }) };
      }
      if (url.includes(`/api/users/${userId}/ai/threads`) && method === "POST" && !url.includes("/messages")) {
        return {
          ok: true,
          json: async () => ({
            thread_id: "thread-1",
            exploration_mode: "money-soon",
            created_at: new Date().toISOString(),
          }),
        };
      }
      if (url.includes("/api/users/11111111-1111-1111-1111-111111111111/events") && method === "POST") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      if (url.includes(`/api/users/${userId}/ai/threads/thread-1/messages`) && method === "POST") {
        const body = JSON.parse(String(init?.body || "{}"));
        if (body.message === "unsafe") {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                code: "AI_COACH_UNSAFE_INPUT",
                message: "blocked",
                details: { safe_response: "Please ask a safer career question." },
              },
            }),
          };
        }
        if (body.message?.toLowerCase().includes("build my plan")) {
          return {
            ok: true,
            json: async () => ({
              thread_id: "thread-1",
              assistant_message: "I've created a personalized plan for you!",
              updated_profile_json: {},
              completeness: 60,
              blocked: false,
              actions: { show_milestones: true, generated_count: 8, macro_id: 1 },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            thread_id: "thread-1",
            assistant_message: "What subjects energize you most?",
            updated_profile_json: {},
            completeness: 20,
            blocked: false,
          }),
        };
      }
      if (url.includes(`/api/users/${userId}/milestones/tree`) && method === "GET") {
        return { ok: true, json: async () => ({ tree: [] }) };
      }

      return { ok: true, json: async () => [] };
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    window.localStorage.setItem("upath_demo_user_id", userId);
  });

  it("shows starter mode prompt", async () => {
    renderAppWithIdentity(<Explore />, { route: "/explore" });
    expect(await screen.findByText(/pick a starter mode/i)).toBeInTheDocument();
  });

  it("shows 'View My New Plan' CTA when AI returns show_milestones action", async () => {
    renderAppWithIdentity(<Explore />, { route: "/explore" });
    fireEvent.click(await screen.findByRole("button", { name: /money soon/i }));
    await screen.findByText(/what subjects energize you most/i);

    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "build my plan for software development" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /view my new plan/i })).toBeInTheDocument();
    });
  });

  it("shows blocked state when unsafe message is sent", async () => {
    renderAppWithIdentity(<Explore />, { route: "/explore" });
    fireEvent.click(await screen.findByRole("button", { name: /money soon/i }));
    await screen.findByText(/what subjects energize you most/i);

    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "unsafe" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not be processed safely/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/please ask a safer career question/i)).toBeInTheDocument();
  });
});
