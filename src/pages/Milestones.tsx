import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Flag, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import {
  fetchUser,
  fetchUserProgress,
  fetchGoals,
  patchProgress,
  patchUserGoal,
  createUserProgress,
  type UserProgressWithGoal,
  type Goal,
} from "@/lib/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function milestoneLabel(p: UserProgressWithGoal, index: 1 | 2 | 3): string {
  if (index === 1) return p.milestone1 ?? "Milestone 1";
  if (index === 2) return p.milestone2 ?? "Milestone 2";
  return p.milestone_n ?? "Final milestone";
}

function completed(p: UserProgressWithGoal, index: 1 | 2 | 3): boolean {
  if (index === 1) return p.milestone1_is_complete;
  if (index === 2) return p.milestone2_is_complete;
  return p.milestone_n_is_complete;
}

function MilestoneRow({
  label,
  done,
  onToggle,
  disabled,
}: {
  label: string;
  done: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          )}
        >
          {done ? <Star className="h-5 w-5" /> : <Flag className="h-4 w-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mb-4 flex-1 rounded-xl bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <h3 className={cn("font-semibold", done ? "text-foreground" : "text-foreground")}>{label}</h3>
          <ChevronRight
            className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")}
          />
        </div>
        {expanded && <p className="mt-1 text-sm text-muted-foreground">Mark as complete when you’ve finished this step.</p>}
      </button>
    </div>
  );
}

function GoalPicker({
  goals,
  currentGoalId,
  onSelect,
  disabled,
}: {
  goals: Goal[];
  currentGoalId: string | null;
  onSelect: (goalId: number) => void;
  disabled: boolean;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Choose your goal</CardTitle>
        <p className="text-sm text-muted-foreground">Pick a path to start tracking milestones.</p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {goals.map((g) => (
          <Button
            key={g.goal_id}
            variant={String(g.goal_id) === currentGoalId ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            disabled={disabled}
            onClick={() => onSelect(Number(g.goal_id))}
          >
            {g.title}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

const Milestones = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoIdentity();

  const { data: progressList = [], isLoading: progressLoading, isError: progressError } = useQuery({
    queryKey: ["user-progress", userId],
    queryFn: () => fetchUserProgress(userId!),
    enabled: !!userId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });

  const patchProgressMutation = useMutation({
    mutationFn: ({
      userId: uid,
      goalId,
      payload,
    }: {
      userId: string;
      goalId: number;
      payload: { milestone1_is_complete?: boolean; milestone2_is_complete?: boolean; milestone_n_is_complete?: boolean };
    }) => patchProgress(uid, goalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress", userId] });
      toast.success("Progress updated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update"),
  });

  const setGoalMutation = useMutation({
    mutationFn: (goalId: number) => patchUserGoal(userId!, goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-progress", userId] });
      toast.success("Goal set");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to set goal"),
  });

  const ensureProgressMutation = useMutation({
    mutationFn: (goalId: number) => createUserProgress(userId!, goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress", userId] });
    },
  });

  const currentGoalId = user?.goal_id ?? null;
  const primaryProgress = progressList.find((p) => String(p.goal_id) === String(currentGoalId));
  const completedCount = primaryProgress
    ? [primaryProgress.milestone1_is_complete, primaryProgress.milestone2_is_complete, primaryProgress.milestone_n_is_complete].filter(Boolean).length
    : 0;
  const progressPct = primaryProgress ? Math.round((completedCount / 3) * 100) : 0;

  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">Select a demo profile above to track milestones.</p>
      </div>
    );
  }

  if (progressError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <Alert variant="destructive">
          <AlertDescription>
            We couldn’t load your progress. Check that the backend is running and the database is set up.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (progressLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">Track your progress step by step</p>
      </div>

      {!currentGoalId && goals.length > 0 && (
        <GoalPicker
          goals={goals}
          currentGoalId={currentGoalId}
          onSelect={(goalId) => setGoalMutation.mutate(goalId)}
          disabled={setGoalMutation.isPending}
        />
      )}

      {currentGoalId && !primaryProgress && goals.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Your goal is set.{" "}
          <Button
            variant="link"
            className="p-0 h-auto text-primary"
            disabled={ensureProgressMutation.isPending}
            onClick={() => ensureProgressMutation.mutate(Number(currentGoalId))}
          >
            Start tracking
          </Button>{" "}
          to see milestones here.
        </p>
      )}

      {primaryProgress && (
        <>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Current goal</p>
              <CardTitle className="text-lg">{primaryProgress.goal_title ?? "Goal"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Overall progress</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="relative space-y-0">
            {([1, 2, 3] as const).map((index, i) => (
              <div key={index} className="relative">
                <MilestoneRow
                  label={milestoneLabel(primaryProgress, index)}
                  done={completed(primaryProgress, index)}
                  onToggle={() => {
                    const next = !completed(primaryProgress, index);
                    patchProgressMutation.mutate({
                      userId: userId!,
                      goalId: Number(primaryProgress.goal_id),
                      payload:
                        index === 1
                          ? { milestone1_is_complete: next }
                          : index === 2
                            ? { milestone2_is_complete: next }
                            : { milestone_n_is_complete: next },
                    });
                  }}
                  disabled={patchProgressMutation.isPending}
                />
                {i < 2 && (
                  <div
                    className={cn(
                      "ml-5 w-0.5 min-h-[1rem]",
                      completed(primaryProgress, index) ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {currentGoalId && progressList.length > 0 && !primaryProgress && (
        <p className="text-sm text-muted-foreground">
          You have progress on other goals. Your current goal does not have progress yet—complete a milestone to see it
          here, or switch goal above.
        </p>
      )}
    </div>
  );
};

export default Milestones;
