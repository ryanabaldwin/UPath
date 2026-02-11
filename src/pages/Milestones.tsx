import { Star, Flag, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { milestones } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Milestones = () => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = Math.round((completedCount / milestones.length) * 100);
  const nextMilestone = milestones.find((m) => !m.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Journey</h1>
        <p className="text-muted-foreground">Track your progress step by step</p>
      </div>

      {/* Next Goal Card */}
      {nextMilestone && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next Goal</p>
            <CardTitle className="text-lg">{nextMilestone.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{nextMilestone.description}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone Path */}
      <div className="relative space-y-0">
        {milestones.map((m, i) => (
          <div key={m.id} className="relative flex gap-4">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  m.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {m.completed ? <Star className="h-5 w-5" /> : <Flag className="h-4 w-4" />}
              </div>
              {i < milestones.length - 1 && (
                <div className={cn("w-0.5 flex-1 min-h-[2rem]", m.completed ? "bg-primary/40" : "bg-border")} />
              )}
            </div>

            {/* Content */}
            <button
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              className="mb-4 flex-1 rounded-xl bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className={cn("font-semibold", m.completed ? "text-foreground" : "text-foreground")}>
                  {m.title}
                </h3>
                <ChevronRight
                  className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded === m.id && "rotate-90")}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              {expanded === m.id && m.steps && (
                <ul className="mt-3 space-y-1.5">
                  {m.steps.map((step, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {step}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Milestones;
