import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Users, Compass, BookOpen, ArrowRight, Star } from "lucide-react";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import {
  fetchMilestoneTree,
  fetchUserMeetings,
  fetchUserBookmarks,
  fetchGoals,
  fetchNextPlanStep,
  type MilestoneNode,
} from "@/lib/api";

const Dashboard = () => {
  const { userId, user } = useDemoIdentity();

  const { data: treeData } = useQuery({
    queryKey: ["milestone-tree", userId],
    queryFn: () => fetchMilestoneTree(userId!),
    enabled: !!userId,
    retry: false,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["user-meetings", userId],
    queryFn: () => fetchUserMeetings(userId!),
    enabled: !!userId,
    retry: false,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks", userId],
    queryFn: () => fetchUserBookmarks(userId!),
    enabled: !!userId,
    retry: false,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => fetchGoals(),
  });

  const { data: nextStepData } = useQuery({
    queryKey: ["next-step", userId],
    queryFn: () => fetchNextPlanStep(userId!),
    enabled: !!userId,
    retry: false,
  });

  const tree = treeData?.tree ?? [];

  // Collect all daily nodes recursively for progress computation
  const allDailies: MilestoneNode[] = [];
  function collectDailies(nodes: MilestoneNode[]) {
    for (const n of nodes) {
      if (n.tier === "daily") allDailies.push(n);
      if (n.children.length > 0) collectDailies(n.children);
    }
  }
  collectDailies(tree);

  const completedDailies = allDailies.filter((n) => n.status === "complete").length;
  const progressPct = allDailies.length > 0 ? Math.round((completedDailies / allDailies.length) * 100) : 0;
  const hasMilestones = tree.length > 0;
  const macroNode = tree.find((n) => n.tier === "macro");

  const nextMeeting = meetings[0];

  const hasMentor = meetings.length > 0;
  const hasExplored = goals.length > 0;
  const checklistDone = hasMilestones && hasMentor;
  const checklistSteps = [
    { done: hasMilestones, label: "Create your milestone plan", to: "/milestones", icon: Map },
    { done: hasMentor, label: "Connect with a mentor", to: "/mentors", icon: Users },
    { done: hasExplored, label: "Explore career paths", to: "/explore", icon: Compass },
  ];

  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Your Dashboard</h1>
        <p className="text-muted-foreground">
          Select a demo profile above to see your goals, progress, and next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hi, {user?.user_first ?? "there"}
        </h1>
        <p className="text-muted-foreground">
          Here’s where you stand and what’s next.
        </p>
      </div>

      {/* Onboarding checklist */}
      {!checklistDone && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Get started
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete these steps to get the most out of UPath.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklistSteps.map(({ done, label, to, icon: Icon }) => (
              <Link key={to} to={to}>
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.location.href = to;
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden
                    >
                      {done ? "✓" : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current milestone plan progress */}
      {hasMilestones && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your plan</CardTitle>
            <p className="text-sm text-muted-foreground">{macroNode?.title ?? "Milestone plan"}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily steps</span>
              <span className="font-semibold text-foreground">{completedDailies} / {allDailies.length} complete</span>
            </div>
            <Progress value={progressPct} className="h-2" aria-label={`Plan progress ${progressPct} percent`} />
            <Button variant="outline" size="sm" className="w-full rounded-full" asChild>
              <Link to="/milestones">View milestones</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasMilestones && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">Create a milestone plan to track your progress.</p>
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/milestones">Get started</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {nextStepData?.next_step && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Next step from your plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{nextStepData.next_step.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {nextStepData.next_step.week} · ~{nextStepData.next_step.estimated_hours} hrs · $
              {nextStepData.next_step.estimated_cost_usd} estimated
            </p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" asChild>
              <Link to="/milestones">Track this step</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next mentor session */}
      {nextMeeting && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Next mentor session</CardTitle>
            <p className="text-sm text-muted-foreground">
              {nextMeeting.mentor_first} {nextMeeting.mentor_last}
              {nextMeeting.specialty ? ` · ${nextMeeting.specialty}` : ""}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              {new Date(nextMeeting.time).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" asChild>
              <Link to="/mentors">View all mentors</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved resources */}
      {bookmarks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Saved resources</CardTitle>
            <p className="text-sm text-muted-foreground">{bookmarks.length} saved</p>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link to="/resources">View resources</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-1 py-4" asChild>
          <Link to="/explore">
            <Compass className="h-5 w-5" />
            <span>Explore</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-4" asChild>
          <Link to="/resources">
            <BookOpen className="h-5 w-5" />
            <span>Resources</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
