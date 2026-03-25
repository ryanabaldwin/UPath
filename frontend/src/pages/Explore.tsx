import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { careerPaths } from "@/data/mockData";
import { Sparkles, MessageCircle, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { toast } from "sonner";
import {
  API_BASE_URL,
  ApiError,
  createAiThread,
  createRecommendations,
  fetchCareers,
  fetchUserPreferences,
  fetchUserProfile,
  putUserPreferences,
  sendAiThreadMessage,
  trackUserEvent,
} from "@/lib/api";

// added types for AI messages
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: import("@/lib/aiTypes").AiMilestoneActions;
};

const EXPLORATION_MODES = [
  { id: "money-soon", label: "Money soon" },
  { id: "helping-people", label: "Helping people" },
  { id: "building", label: "Building things" },
  { id: "not-sure", label: "Not sure yet" },
];

const Explore = () => {
  const { userId } = useDemoIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [interests, setInterests] = useState("");

  // added to help with AI recommendations
  const [recommendedCategories, setRecommendedCategories] = useState<string[]>([]);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatState, setChatState] = useState<"idle" | "sending" | "blocked" | "error" | "ready">("idle");
  const [chatError, setChatError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  // Auto-scroll chat to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Derived: true when a mode is active but the backend didn't create a thread (mock mode)
  const isUsingMockAi = mode !== null && !threadId;

  const { data: prefs } = useQuery({
    queryKey: ["preferences", userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    retry: false,
  });

  const { data: careersData = [] } = useQuery({
    queryKey: ["careers"],
    queryFn: () => fetchCareers(),
  });

  useEffect(() => {
    if (prefs) {
      if (Array.isArray(prefs.selected_career_paths)) setSelected(prefs.selected_career_paths);
      if (prefs.interests != null) setInterests(prefs.interests);
    }
  }, [prefs]);

  useEffect(() => {
    if (profile?.thread_id) {
      setThreadId(profile.thread_id);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => putUserPreferences(userId!, { interests, selected_career_paths: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", userId] });
    },
  });

  const startThreadMutation = useMutation({
    mutationFn: async (explorationMode: string) => {
      const created = await createAiThread(userId!, explorationMode);
      await trackUserEvent(userId!, "profile_started", { exploration_mode: explorationMode });
      return created;
    },
  });

  const messageMutation = useMutation({
    mutationFn: (payload: { threadId: string; message: string }) =>
      sendAiThreadMessage(userId!, payload.threadId, payload.message),
  });

  const recommendationsMutation = useMutation({
    mutationFn: (intent?: string) => createRecommendations(userId!, { intent }),
    onError: (e: Error) => toast.error(e.message || "Failed to generate recommendations"),
  });

  const toggle = (path: string) =>
    setSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );

  const handleStartMode = async (explorationMode: string) => {
    setMode(explorationMode);
    setChatError(null);
    setChatState("sending");

    const kickoff = `I want to explore with the "${explorationMode}" mode.`;

    try {
      if (userId) {
        const created = await startThreadMutation.mutateAsync(explorationMode);
        setThreadId(created.thread_id);

        const reply = await messageMutation.mutateAsync({
          threadId: created.thread_id,
          message: kickoff,
        });

        setMessages([
          { id: crypto.randomUUID(), role: "user", text: kickoff },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: reply.assistant_message,
          },
        ]);

        setChatState("ready");
        return;
      }
    } catch (error) {
      console.warn("Backend failed, using mock AI", error);
    }

    // FALLBACK: mock AI
    setMessages([
      { id: crypto.randomUUID(), role: "user", text: kickoff },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Let's explore your future together! What kinds of things do you enjoy?",
      },
    ]);

    setChatState("ready");
  };

  const saveUserResponse = async (response: string) => {
    try {
      if (userId) {
        await fetch(`${API_BASE_URL}/api/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            response,
          }),
        });
      }
    } catch (error) {
      console.warn("Backend not available, saving locally", error);
    }

    const saved = JSON.parse(localStorage.getItem("responses") || "[]");
    saved.push(response);
    localStorage.setItem("responses", JSON.stringify(saved));
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    saveUserResponse(text);
    setChatInput("");

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      if (userId && threadId) {
        const reply = await messageMutation.mutateAsync({
          threadId,
          message: text,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: reply.assistant_message,
          },
        ]);

        return;
      }
    } catch (error) {
      console.warn("Backend failed, using mock response", error);
    }

    // FALLBACK AI response
    let response = "That's really interesting! Let's explore some careers that match that.";
    const categories: string[] = [];

    if (text.toLowerCase().includes("help") || text.toLowerCase().includes("people")) {
      response = "You might enjoy careers in healthcare, education, or social work.";
      categories.push("Healthcare", "Education");
    } else if (text.toLowerCase().includes("tech") || text.toLowerCase().includes("computer")) {
      response = "Technology careers like software engineering or computer engineering could be a great fit.";
      categories.push("Software Development", "Computer Engineering");
    } else if (text.toLowerCase().includes("money") || text.toLowerCase().includes("business")) {
      response = "Careers in tech, business, and engineering often have high earning potential.";
      categories.push("Business & Entrepreneurship", "Software Development", "Computer Engineering");
    } else if (text.toLowerCase().includes("building") || text.toLowerCase().includes("creating")) {
      response = "Careers in engineering, construction, or interior design could be a good fit.";
      categories.push("Trades & Technical Skills");
    }

    if (categories.length > 0) {
      setRecommendedCategories((prev) => [...new Set([...prev, ...categories])]);
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: response,
        },
      ]);
    }, 500);
  };

  const handleFindPath = async () => {
    setSavedMessage(true);

    if (!userId) {
      setTimeout(() => {
        navigate("/careers", { state: { selectedPaths: selected, interests } });
      }, 1000);
      return;
    }

    await saveMutation.mutateAsync();

    const recs = await recommendationsMutation.mutateAsync(undefined);

    await trackUserEvent(userId, "profile_completed", {
      selected_count: selected.length,
      has_interests: Boolean(interests.trim()),
      mode,
    });

    setTimeout(() => {
      navigate("/careers", {
        state: {
          selectedPaths: selected,
          interests,
          matches: recs.matches,
          runId: recs.run_id,
        },
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Explore Your Future</h1>
        <p className="mt-1 text-muted-foreground">Start with AI coaching, then get explainable matches.</p>
      </div>

      {!threadId && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">Pick a starter mode</p>
          <div className="flex flex-wrap gap-2">
            {EXPLORATION_MODES.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="rounded-full"
                disabled={startThreadMutation.isPending}
                onClick={() => {
                  void handleStartMode(option.id);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">AI Intake Coach</p>
          {profile && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {profile.completeness}% complete
            </span>
          )}
          {isUsingMockAi && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              <WifiOff className="h-3 w-3" />
              Demo mode
            </span>
          )}
        </div>
        <div className="max-h-56 space-y-2 overflow-auto rounded-lg bg-muted/40 p-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Choose a starter mode to begin. The coach will ask one question at a time.
            </p>
          )}
          {messages.map((m, idx) => (
            <div key={m.id || `${m.role}-${idx}`} className="space-y-1.5">
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                    : "mr-auto max-w-[85%] bg-background text-foreground border border-border"
                )}
              >
                {m.text}
              </div>
              {m.role === "assistant" && m.actions?.show_milestones && (
                <div className="mr-auto max-w-[85%] rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <p className="text-xs font-medium text-primary mb-1.5">Your plan has been created!</p>
                  <Button
                    size="sm"
                    className="rounded-full h-7 text-xs"
                    onClick={() => navigate("/milestones")}
                  >
                    View My New Plan
                  </Button>
                </div>
              )}
              {m.role === "assistant" && m.actions?.show_mentors && (m.actions.mentor_ids?.length ?? 0) > 0 && (
                <div className="mr-auto max-w-[85%] rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-xs font-medium text-foreground mb-1.5">
                    Found {m.actions.mentor_ids!.length} mentor{m.actions.mentor_ids!.length !== 1 ? "s" : ""} in that field
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-7 text-xs"
                    onClick={() => navigate("/mentors")}
                  >
                    View Mentors
                  </Button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your answer..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="min-h-[70px] resize-none"
            disabled={messageMutation.isPending || startThreadMutation.isPending}
          />
          <Button
            className="self-end rounded-full"
            disabled={!chatInput.trim() || messageMutation.isPending || startThreadMutation.isPending}
            onClick={() => {
              void handleSend();
            }}
          >
            {messageMutation.isPending ? "Sending..." : "Send"}
          </Button>
        </div>
        {chatState === "blocked" && (
          <p className="text-xs text-amber-600">
            That message could not be processed safely. The coach sent a safer redirection.
          </p>
        )}
        {chatState === "error" && chatError && (
          <p className="text-xs text-destructive">Coach error: {chatError}</p>
        )}
        {profile?.profile_json?.summary && (
          <p className="text-sm text-muted-foreground">Profile summary: {profile.profile_json.summary}</p>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Select Your Career Interests</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {careerPaths.map((path) => (
          <button
            key={path}
            onClick={() => toggle(path)}
            className={cn(
              "rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
              selected.includes(path)
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {path}
          </button>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Career Examples</h2>
      </div>

      {recommendedCategories.length > 0 && (
        <p className="text-center text-sm text-primary font-medium">
          Showing careers related to: {recommendedCategories.join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {careersData.map((career) => (
          <div
            key={career.career_id}
            className={cn(
              "p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all",
              recommendedCategories.includes(career.category) ||
              selected.includes(career.category)
                ? "border-primary ring-2 ring-primary scale-105"
                : ""
            )}
          >
            <h3 className="font-semibold text-lg">{career.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {career.description}
            </p>
            <p className="text-xs mt-2 text-primary">
              {career.category}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-center text-sm font-medium text-foreground">
          Tell us more about your interests ✨
        </label>
        <Textarea
          placeholder="I love building things, solving puzzles, helping people..."
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          className="min-h-[120px] rounded-xl resize-none"
        />
      </div>

      {savedMessage && (
        <p className="text-green-600 text-sm text-center">
          ✅ Your response has been saved!
        </p>
      )}

      <div className="flex justify-center">
        <Button
          size="lg"
          className="rounded-full px-10"
          disabled={(selected.length === 0 && !interests) || recommendationsMutation.isPending}
          onClick={() => {
            void handleFindPath();
          }}
        >
          {saveMutation.isPending || recommendationsMutation.isPending ? "Building your matches…" : "Find My Path"}
        </Button>
      </div>
    </div>
  );
};

export default Explore;
