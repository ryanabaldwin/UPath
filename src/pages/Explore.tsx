import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { careerPaths } from "@/data/mockData";
import { Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import {
  ApiError,
  createAiThread,
  createRecommendations,
  fetchUserPreferences,
  fetchUserProfile,
  putUserPreferences,
  sendAiThreadMessage,
  trackUserEvent,
} from "@/lib/api";
import { toast } from "sonner";

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

  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    text: string;
    actions?: import("@/lib/aiTypes").AiMilestoneActions;
  }>>([]);
  const [chatState, setChatState] = useState<"idle" | "sending" | "blocked" | "error" | "ready">("idle");
  const [chatError, setChatError] = useState<string | null>(null);

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
    if (!userId) return;
    setChatError(null);
    setChatState("sending");
    setMode(explorationMode);
    try {
      const created = await startThreadMutation.mutateAsync(explorationMode);
      setThreadId(created.thread_id);
      const kickoff = `I want to explore with the "${explorationMode}" mode.`;
      const kickoffId = crypto.randomUUID();
      setMessages([{ id: kickoffId, role: "user", text: kickoff }]);
      const reply = await messageMutation.mutateAsync({ threadId: created.thread_id, message: kickoff });
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply.assistant_message,
        actions: reply.actions,
      }]);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      if (reply.actions?.show_milestones) {
        queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
      }
      setChatState("ready");
    } catch (error) {
      setMessages([]);
      const message = error instanceof Error ? error.message : "Failed to start AI coach";
      setChatError(message);
      setChatState("error");
      toast.error(message);
    }
  };

  const handleSend = async () => {
    if (!userId || !threadId || !chatInput.trim()) return;
    setChatError(null);
    setChatState("sending");
    const text = chatInput.trim();
    const userMessageId = crypto.randomUUID();
    setChatInput("");
    setMessages((prev) => [...prev, { id: userMessageId, role: "user", text }]);
    try {
      const reply = await messageMutation.mutateAsync({ threadId, message: text });
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply.assistant_message,
        actions: reply.actions,
      }]);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      if (reply.actions?.show_milestones) {
        queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
      }
      setChatState("ready");
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== userMessageId));
      const fallbackMessage = error instanceof Error ? error.message : "Failed to send message";
      if (error instanceof ApiError && error.code === "AI_COACH_UNSAFE_INPUT") {
        const safeResponse =
          typeof error.details?.safe_response === "string"
            ? error.details.safe_response
            : "I can’t help with harmful requests. Please ask another question.";
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: safeResponse }]);
        setChatState("blocked");
        return;
      }
      setChatError(fallbackMessage);
      setChatState("error");
      toast.error(fallbackMessage);
    }
  };

  const handleFindPath = async () => {
    if (!userId) {
      navigate("/dashboard", { state: { selectedPaths: selected, interests } });
      return;
    }
    await saveMutation.mutateAsync();
    const recs = await recommendationsMutation.mutateAsync(undefined);
    await trackUserEvent(userId, "profile_completed", {
      selected_count: selected.length,
      has_interests: Boolean(interests.trim()),
      mode,
    });
    navigate("/dashboard", {
      state: {
        selectedPaths: selected,
        interests,
        matches: recs.matches,
        runId: recs.run_id,
      },
    });
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
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your answer..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="min-h-[70px] resize-none"
            disabled={!threadId || messageMutation.isPending || startThreadMutation.isPending}
          />
          <Button
            className="self-end rounded-full"
            disabled={!threadId || !chatInput.trim() || messageMutation.isPending || startThreadMutation.isPending}
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
