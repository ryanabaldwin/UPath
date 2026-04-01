import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, GraduationCap, Clock, DollarSign, Heart, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createRecommendations,
  generateMilestoneJourney,
  trackUserEvent,
} from "@/lib/api";
import { toast } from "sonner";
import type { RecommendationMatch } from "@/lib/aiTypes";

const CAREER_SESSION_KEY = "upath_career_state";
const CAREER_PATH_KEY_OVERRIDES: Record<string, string> = {
  "software development": "software-development",
  healthcare: "healthcare",
  "product management": "product-management",
  "trades & technical skills": "trades-technical",
  "trades and technical skills": "trades-technical",
  "trades & technical": "trades-technical",
  "computer engineering": "computer-engineering",
  "business & entrepreneurship": "business-entrepreneurship",
  "business and entrepreneurship": "business-entrepreneurship",
  education: "education",
  "creative arts & design": "creative-arts-design",
  "creative arts and design": "creative-arts-design",
  science: "science",
  "data & analytics": "data-analytics",
  "data and analytics": "data-analytics",
};

function toCareerPathKey(pathTitle: string): string {
  const normalized = pathTitle.trim().toLowerCase();
  const overridden = CAREER_PATH_KEY_OVERRIDES[normalized];
  if (overridden) return overridden;
  return normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const FALLBACK_MATCHES: RecommendationMatch[] = [
  {
    path_title: "Software Development",
    emoji: "💻",
    confidence: 88,
    reasons: ["Strong fit for builder mindset", "High demand across many regions"],
    tradeoffs: "Good long-term upside, but requires consistent project practice.",
    what_to_verify: ["Entry role requirements", "Local bootcamp/school costs"],
    stats: {
      salary_range: "$70K - $150K+",
      education: "Bootcamp, Associate's, or Bachelor's",
      time_to_entry: "6 months - 4 years",
    },
  },
  {
    path_title: "Healthcare",
    emoji: "🩺",
    confidence: 82,
    reasons: ["Great fit for helping-people goals", "Stable and growing demand"],
    tradeoffs: "High impact roles often require licenses or certifications.",
    what_to_verify: ["Certification timelines", "Shift schedule options"],
    stats: {
      salary_range: "$45K - $120K+",
      education: "Certificate, Associate's, or Bachelor's",
      time_to_entry: "1 - 6 years",
    },
  },
];

const CareerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  // Persist state to sessionStorage so page survives refresh / direct URL access
  const locationState = location.state as
    | {
        selectedPaths?: string[];
        interests?: string;
        matches?: RecommendationMatch[];
        runId?: string;
      }
    | null;

  useEffect(() => {
    if (locationState) {
      sessionStorage.setItem(CAREER_SESSION_KEY, JSON.stringify(locationState));
    }
  }, [locationState]);

  const restoredState = (() => {
    try {
      const s = sessionStorage.getItem(CAREER_SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const state = locationState ?? restoredState;

  const selectedPaths = state?.selectedPaths ?? [];
  const interests = state?.interests ?? "";
  const incomingMatches = state?.matches ?? FALLBACK_MATCHES;
  const runId = state?.runId;

  const recommendationMutation = useMutation({
    mutationFn: (intent: string) => createRecommendations(userId!, { intent }),
    onError: (e: Error) => toast.error(e.message || "Unable to refresh recommendations"),
  });

  const buildPlanMutation = useMutation({
    mutationFn: (selectedPath: string) =>
      generateMilestoneJourney(userId!, { career_path_key: toCareerPathKey(selectedPath) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
      queryClient.invalidateQueries({ queryKey: ["next-step", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success("Your milestone plan is ready");
    },
    onError: (e: Error) => toast.error(e.message || "Unable to build your plan"),
  });

  const displayedMatches = recommendationMutation.data?.matches ?? incomingMatches;
  const generatedJourney = buildPlanMutation.data;

  const handleRegenerate = async (intent: string) => {
    if (!userId) return;
    const res = await recommendationMutation.mutateAsync(intent);
    await trackUserEvent(userId, "recommendation_generated", {
      intent,
      run_id: res.run_id,
      previous_run_id: runId ?? null,
    });
  };

  const handleBuildPlan = async (selectedPath: string) => {
    if (!userId) return;
    const res = await buildPlanMutation.mutateAsync(selectedPath);
    await trackUserEvent(userId, "milestone_journey_generated", {
      journey_plan_id: res.journey_plan_id,
      generated_count: res.generated_count,
      plan_end_date: res.plan_end_date,
      career_path_key: res.career_path_key,
      selected_path: selectedPath,
    });
  };

  const handleGoToMilestones = async () => {
    if (userId && generatedJourney) {
      await trackUserEvent(userId, "milestone_plan_started", {
        journey_plan_id: generatedJourney.journey_plan_id,
      });
    }
    navigate("/milestones");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Career Matches</h1>
        <p className="mt-1 text-muted-foreground">
          {selectedPaths.length > 0 || interests
            ? "Based on your profile, here are explainable matches."
            : "Explore these explainable matches and build your plan."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void handleRegenerate("more-like-this")}
          disabled={!userId || recommendationMutation.isPending}
        >
          More like this
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void handleRegenerate("less-like-this")}
          disabled={!userId || recommendationMutation.isPending}
        >
          Less like this
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void handleRegenerate("surprise")}
          disabled={!userId || recommendationMutation.isPending}
        >
          Surprise me
        </Button>
      </div>

      {displayedMatches.map((career) => (
        <Card key={career.path_title} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{career.emoji}</span>
                <div>
                  <CardTitle className="text-lg">{career.path_title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{career.tradeoffs}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-primary/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Heart className="h-4 w-4 text-primary" />
                  Confidence
                </span>
                <span className="font-bold text-primary">{career.confidence}%</span>
              </div>
              <Progress value={career.confidence} className="mt-2 h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <DollarSign className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Salary</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{career.stats.salary_range}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <GraduationCap className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Education</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{career.stats.education}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Time to entry</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{career.stats.time_to_entry}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Why this fits you</h4>
              <div className="flex flex-wrap gap-2">
                {career.reasons.map((reason) => (
                  <Badge key={reason} variant="secondary" className="rounded-full text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">What to verify</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {career.what_to_verify.map((verify) => (
                  <li key={verify}>• {verify}</li>
                ))}
              </ul>
            </div>

            <Button
              className="rounded-full"
              disabled={!userId || buildPlanMutation.isPending}
              onClick={() => void handleBuildPlan(career.path_title)}
            >
              Build my plan
            </Button>
          </CardContent>
        </Card>
      ))}

      {generatedJourney && <JourneyGeneratedCard onGoToMilestones={() => void handleGoToMilestones()} />}

      <div className="rounded-xl bg-primary/5 p-6 text-center">
        <Briefcase className="mx-auto mb-2 h-8 w-8 text-primary" />
        <h3 className="font-semibold text-foreground">Ready to take the next step?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a plan from any match, then convert it into trackable milestones.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button className="rounded-full" asChild>
            <Link to="/milestones">Go to Milestones</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/resources">Browse Resources</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

function JourneyGeneratedCard({ onGoToMilestones }: { onGoToMilestones: () => void }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your milestone plan is ready</CardTitle>
        <p className="text-sm text-muted-foreground">
          We generated your journey milestones. Open Milestones to review and start tracking progress.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="rounded-full" onClick={onGoToMilestones}>
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Go to Milestones
        </Button>
      </CardContent>
    </Card>
  );
}

export default CareerDetails;
