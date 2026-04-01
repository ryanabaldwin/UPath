import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Flag, ChevronRight, ChevronDown, Flame, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMilestoneTree,
  patchMilestone,
  createMilestone,
  fetchNextPlanStep,
  type MilestoneNode,
  type CreateMilestoneInput,
  type PatchMilestoneInput,
} from "@/lib/api";
import type { MilestoneTier, MilestoneCategory } from "@/lib/aiTypes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TIER_LABELS: Record<string, string> = {
  macro: "North Star",
  checkpoint: "Checkpoint",
  domain: "Focus Area",
  daily: "Action Step",
};

const TIER_ORDER = ["macro", "checkpoint", "domain", "daily"] as const;

const CATEGORY_OPTIONS: { value: MilestoneCategory; label: string }[] = [
  { value: "school", label: "School" },
  { value: "work", label: "Work" },
  { value: "life", label: "Life" },
  { value: "finance", label: "Finance" },
];

const NONE_CATEGORY = "__none__";

const CATEGORY_COLORS: Record<string, string> = {
  school: "bg-blue-100 text-blue-700 border-blue-200",
  work: "bg-violet-100 text-violet-700 border-violet-200",
  life: "bg-green-100 text-green-700 border-green-200",
  finance: "bg-amber-100 text-amber-700 border-amber-200",
};

function defaultChildTier(parentTier: MilestoneTier): MilestoneTier {
  const i = TIER_ORDER.indexOf(parentTier);
  const next = i < 0 ? 0 : Math.min(i + 1, TIER_ORDER.length - 1);
  return TIER_ORDER[next];
}

function countCompleteInTree(nodes: MilestoneNode[]): number {
  let total = 0;
  for (const n of nodes) {
    if (n.status === "complete") total++;
    if (n.children.length > 0) total += countCompleteInTree(n.children);
  }
  return total;
}

type MilestoneDialog =
  | { mode: "add"; parent: MilestoneNode }
  | { mode: "add-root" }
  | { mode: "edit"; node: MilestoneNode }
  | null;

function MilestoneRow({
  node,
  onToggle,
  onAddChild,
  onEdit,
  disabled,
  depth = 0,
}: {
  node: MilestoneNode;
  onToggle: (id: number, done: boolean) => void;
  onAddChild: (node: MilestoneNode) => void;
  onEdit: (node: MilestoneNode) => void;
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
            <div className="flex shrink-0 items-start gap-0.5">
              <button
                type="button"
                onClick={() => onAddChild(node)}
                disabled={disabled}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Add sub-step"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(node)}
                disabled={disabled}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Edit milestone"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>
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
                onAddChild={onAddChild}
                onEdit={onEdit}
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
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [dialog, setDialog] = useState<MilestoneDialog>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>(NONE_CATEGORY);
  const [formDue, setFormDue] = useState("");

  useEffect(() => {
    if (!dialog) return;
    if (dialog.mode === "edit") {
      setFormTitle(dialog.node.title);
      setFormDescription(dialog.node.description ?? "");
      setFormCategory(dialog.node.category ?? NONE_CATEGORY);
      setFormDue(dialog.node.due_date ?? "");
    } else {
      setFormTitle("");
      setFormDescription("");
      setFormCategory(NONE_CATEGORY);
      setFormDue("");
    }
  }, [dialog]);

  const {
    data: treeData,
    isLoading: treeLoading,
    isError: treeError,
  } = useQuery({
    queryKey: ["milestone-tree", userId],
    queryFn: () => fetchMilestoneTree(userId!),
    enabled: !!userId,
  });

  const { data: nextStepData } = useQuery({
    queryKey: ["next-step", userId],
    queryFn: () => fetchNextPlanStep(userId!),
    enabled: !!userId,
    retry: false,
  });

  const invalidateMilestoneQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
    queryClient.invalidateQueries({ queryKey: ["next-step", userId] });
  };

  const patchMutation = useMutation({
    mutationFn: ({ milestoneId, status }: { milestoneId: number; status: "complete" | "pending" }) =>
      patchMilestone(userId!, milestoneId, { status }),
    onSuccess: () => {
      invalidateMilestoneQueries();
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success("Progress saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update"),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateMilestoneInput) => createMilestone(userId!, input),
    onSuccess: () => {
      invalidateMilestoneQueries();
      setDialog(null);
      toast.success("Milestone added");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add milestone"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: PatchMilestoneInput }) =>
      patchMilestone(userId!, id, patch),
    onSuccess: () => {
      invalidateMilestoneQueries();
      setDialog(null);
      toast.success("Milestone updated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update milestone"),
  });

  const handleToggle = (milestoneId: number, currentlyDone: boolean) => {
    patchMutation.mutate({ milestoneId, status: currentlyDone ? "pending" : "complete" });
  };

  const formBusy = createMutation.isPending || editMutation.isPending;
  const rowBusy = patchMutation.isPending || formBusy;

  const submitDialog = () => {
    if (!dialog || !userId) return;
    const title = formTitle.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }
    const description = formDescription.trim();
    const descPayload = description.length > 0 ? description : undefined;
    const categoryPayload: MilestoneCategory | undefined =
      formCategory === NONE_CATEGORY ? undefined : (formCategory as MilestoneCategory);
    const duePayload = formDue.trim() === "" ? undefined : formDue.trim();

    if (dialog.mode === "add-root") {
      const payload: CreateMilestoneInput = {
        title,
        tier: "macro",
        ...(descPayload !== undefined && { description: descPayload }),
        ...(categoryPayload !== undefined && { category: categoryPayload }),
        ...(duePayload !== undefined && { due_date: duePayload }),
      };
      createMutation.mutate(payload);
      return;
    }

    if (dialog.mode === "add") {
      const tier = defaultChildTier(dialog.parent.tier);
      const payload: CreateMilestoneInput = {
        parent_id: dialog.parent.id,
        title,
        tier,
        ...(descPayload !== undefined && { description: descPayload }),
        ...(categoryPayload !== undefined && { category: categoryPayload }),
        ...(duePayload !== undefined && { due_date: duePayload }),
      };
      createMutation.mutate(payload);
      return;
    }

    const patch: PatchMilestoneInput = {
      title,
      description: description.length > 0 ? description : null,
      category: formCategory === NONE_CATEGORY ? null : (formCategory as MilestoneCategory),
      due_date: formDue.trim() === "" ? null : formDue.trim(),
    };
    editMutation.mutate({ id: dialog.node.id, patch });
  };

  const dialogTitle =
    dialog?.mode === "edit"
      ? "Edit milestone"
      : dialog?.mode === "add-root"
        ? "Add North Star"
        : "Add sub-step";

  const dialogTierLabel =
    dialog?.mode === "add"
      ? TIER_LABELS[defaultChildTier(dialog.parent.tier)] ?? defaultChildTier(dialog.parent.tier)
      : dialog?.mode === "add-root"
        ? TIER_LABELS.macro
        : null;

  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">
          Choose a profile from the dropdown above, or{" "}
          <a href="/login" className="text-primary hover:underline">sign in</a>{" "}
          to track your milestones.
        </p>
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
  const completedMilestoneCount = countCompleteInTree(tree);

  const isEmpty = tree.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">Track your progress step by step</p>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialog?.mode === "add" && (
                <>Adding under “{dialog.parent.title}”. New step type: {dialogTierLabel}.</>
              )}
              {dialog?.mode === "add-root" && <>Create a top-level North Star milestone for your plan.</>}
              {dialog?.mode === "edit" && <>Update title, details, category, or due date.</>}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ms-title">Title</Label>
              <Input
                id="ms-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="What will you accomplish?"
                disabled={formBusy}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ms-desc">Description (optional)</Label>
              <Textarea
                id="ms-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Add context or success criteria"
                disabled={formBusy}
                rows={3}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory} disabled={formBusy}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CATEGORY}>None</SelectItem>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ms-due">Due date (optional)</Label>
              <Input
                id="ms-due"
                type="date"
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
                disabled={formBusy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={formBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={submitDialog} disabled={formBusy}>
              {dialog?.mode === "edit" ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Streak */}
      {completedMilestoneCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <Flame className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">
            {completedMilestoneCount} milestone{completedMilestoneCount !== 1 ? "s" : ""} completed
          </span>
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
              No milestone plan yet. Generate one from the Explore page, start from a career match, or add a North Star manually.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/explore")}>
                Go to Explore
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setDialog({ mode: "add-root" })}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add North Star
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
                onAddChild={(n) => setDialog({ mode: "add", parent: n })}
                onEdit={(n) => setDialog({ mode: "edit", node: n })}
                disabled={rowBusy}
                depth={0}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default Milestones;
