import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Flag, ChevronRight, ChevronDown, Flame, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import {
  fetchMilestoneTree,
  patchMilestone,
  generateMilestones,
  fetchUser,
  fetchNextPlanStep,
  type MilestoneNode,
} from "@/lib/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TIER_LABELS: Record<string, string> = {
  macro: "North Star",
  checkpoint: "Checkpoint",
  domain: "Focus Area",
  daily: "Action Step",
};

const TIER_ORDER = ["macro", "checkpoint", "domain", "daily"];

const CATEGORY_COLORS: Record<string, string> = {
  school: "bg-blue-100 text-blue-700 border-blue-200",
  work: "bg-violet-100 text-violet-700 border-violet-200",
  life: "bg-green-100 text-green-700 border-green-200",
  finance: "bg-amber-100 text-amber-700 border-amber-200",
};

function MilestoneRow({
  node,
  onToggle,
  disabled,
  depth = 0,
}: {
  node: MilestoneNode;
  onToggle: (id: number, done: boolean) => void;
  disabled: boolean;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const done = node.status === "complete";
  const hasChildren = node.children.length > 0;

  return (
    <div className={cn("relative", depth > 0 && "ml-6 border-l border-border pl-4")}>
      <div className="relative flex gap-3 pb-3">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => onToggle(node.id, done)}
            disabled={disabled}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              done
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
            aria-label={done ? "Mark incomplete" : "Mark complete"}
          >
            {done ? <Star className="h-4 w-4" /> : <Flag className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div
          className={cn(
            "flex-1 rounded-xl p-3 shadow-sm transition-shadow",
            done ? "bg-muted/50" : "bg-card hover:shadow-md",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className={cn("text-xs font-semibold uppercase tracking-wider", done ? "text-muted-foreground" : "text-primary")}>
                  {TIER_LABELS[node.tier] ?? node.tier}
                </span>
                {node.category && (
                  <Badge variant="outline" className={cn("text-xs py-0 h-4", CATEGORY_COLORS[node.category])}>
                    {node.category}
                  </Badge>
                )}
                {node.due_date && (
                  <span className="text-xs text-muted-foreground">Due {node.due_date}</span>
                )}
              </div>
              <p className={cn("text-sm font-medium leading-snug", done && "line-through text-muted-foreground")}>
                {node.title}
              </p>
              {node.description && expanded && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{node.description}</p>
              )}
            </div>
            {hasChildren && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children
            .slice()
            .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
            .map((child) => (
              <MilestoneRow
                key={child.id}
                node={child}
                onToggle={onToggle}
                disabled={disabled}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

const Milestones = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoIdentity();
  const navigate = useNavigate();

  const {
    data: treeData,
    isLoading: treeLoading,
    isError: treeError,
  } = useQuery({
    queryKey: ["milestone-tree", userId],
    queryFn: () => fetchMilestoneTree(userId!),
    enabled: !!userId,
  });

  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });

  const { data: nextStepData } = useQuery({
    queryKey: ["next-step", userId],
    queryFn: () => fetchNextPlanStep(userId!),
    enabled: !!userId,
    retry: false,
  });

  const patchMutation = useMutation({
    mutationFn: ({ milestoneId, status }: { milestoneId: number; status: "complete" | "pending" }) =>
      patchMilestone(userId!, milestoneId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["next-step", userId] });
      toast.success("Progress saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update"),
  });

  const generateMutation = useMutation({
    mutationFn: (selectedPath: string) => generateMilestones(userId!, selectedPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
      toast.success("Milestone plan created!");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to generate milestones"),
  });

  const handleToggle = (milestoneId: number, currentlyDone: boolean) => {
    patchMutation.mutate({ milestoneId, status: currentlyDone ? "pending" : "complete" });
  };

  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">Select a profile to track milestones.</p>
      </div>
    );
  }

  if (treeError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <Alert variant="destructive">
          <AlertDescription>
            We couldn't load your milestones. Check that the backend is running and the database is set up.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (treeLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const tree = treeData?.tree ?? [];

  // Compute progress from daily nodes
  const allDailyNodes: MilestoneNode[] = [];
  function collectDailies(nodes: MilestoneNode[]) {
    for (const n of nodes) {
      if (n.tier === "daily") allDailyNodes.push(n);
      if (n.children.length > 0) collectDailies(n.children);
    }
  }
  collectDailies(tree);

  const completedDailies = allDailyNodes.filter((n) => n.status === "complete").length;
  const progressPct = allDailyNodes.length > 0 ? Math.round((completedDailies / allDailyNodes.length) * 100) : 0;

  const macroNode = tree.find((n) => n.tier === "macro");
  const streakCount = user?.streak_count ?? 0;

  const isEmpty = tree.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">Track your progress step by step</p>
      </div>

      {/* Streak */}
      {streakCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <Flame className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">{streakCount} milestone{streakCount !== 1 ? "s" : ""} completed</span>
        </div>
      )}

      {/* Next step from plan */}
      {nextStepData?.next_step && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next action step</p>
            <CardTitle className="text-base">{nextStepData.next_step.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {nextStepData.next_step.week}
          </CardContent>
        </Card>
      )}

      {/* Progress header */}
      {!isEmpty && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {macroNode ? "North Star" : "Overall progress"}
            </p>
            <CardTitle className="text-base">{macroNode?.title ?? "Your Plan"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Daily steps</span>
                <span>{completedDailies} / {allDailyNodes.length} complete</span>
              </div>
              <Progress value={progressPct} className="h-2" aria-label={`Progress ${progressPct} percent`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No milestone plan yet. Generate one from the Explore page, or start from a career match.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/explore")}>
                Go to Explore
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate("")}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {generateMutation.isPending ? "Generating…" : "Quick Start Plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone tree */}
      {!isEmpty && (
        <div className="space-y-1">
          {tree
            .slice()
            .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
            .map((node) => (
              <MilestoneRow
                key={node.id}
                node={node}
                onToggle={handleToggle}
                disabled={patchMutation.isPending}
                depth={0}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default Milestones;
