import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Info, Loader2, Target } from "lucide-react";
import { CAREER_PATH_OVERVIEWS, type CareerPathId } from "@/data/careerPathOverviews";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMilestoneTree, generateMilestoneJourney } from "@/lib/api";
import { toast } from "sonner";

const CareerOverview = () => {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug as CareerPathId | undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  const overview = useMemo(() => {
    if (slug && CAREER_PATH_OVERVIEWS[slug]) return CAREER_PATH_OVERVIEWS[slug];
    return null;
  }, [slug]);

  const { data: treeData } = useQuery({
    queryKey: ["milestone-tree", userId],
    queryFn: () => fetchMilestoneTree(userId!),
    enabled: !!userId,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateMilestoneJourney(userId!, { career_path_key: slug! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone-tree", userId] });
      queryClient.invalidateQueries({ queryKey: ["next-step", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      setConfirmReplaceOpen(false);
      toast.success("Your 5-year milestone journey was generated");
      navigate("/milestones");
    },
    onError: (e: Error) => toast.error(e.message || "Could not generate journey"),
  });

  const runGenerate = () => {
    if (!userId || !slug) return;
    generateMutation.mutate();
  };

  const handleBuildClick = () => {
    if (!userId || !slug) return;
    if (treeData?.has_active_generated_plan) {
      setConfirmReplaceOpen(true);
      return;
    }
    runGenerate();
  };

  if (!overview) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            to="/explore"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Career path not found</h1>
          <p className="mt-1 text-muted-foreground">
            We couldn&apos;t find details for that career path. Try choosing a path from Explore again.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/explore">Browse career paths</Link>
        </Button>
      </div>
    );
  }

  const generating = generateMutation.isPending;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/explore"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Link>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
              {overview.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{overview.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{overview.tagline}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">Build your milestone path</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Creates a 5-year plan from our template for this career path. You can edit milestones anytime on the
            Milestones page.
          </p>
          <Button
            className="mt-4 rounded-full"
            size="lg"
            onClick={handleBuildClick}
            disabled={!userId || generating}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Building…
              </>
            ) : (
              "Build my milestone path"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Info className="h-4 w-4 text-primary" />
            Overview
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{overview.summary}</p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">Typical salary range</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{overview.salaryRange}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">Education & training</p>
              <p className="mt-1 text-sm text-foreground">{overview.educationAndTraining}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">Time to get started</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{overview.timeToEntry}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Who this is great for</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {overview.idealFor.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">First steps you can take</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {overview.firstSteps.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">Common roles in this path</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {overview.commonRoles.map((role) => (
            <Badge key={role} variant="secondary" className="rounded-full text-xs">
              {role}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your generated milestone plan?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span>
                You already have a milestone plan created from a template. Building a new plan will remove your current
                template plan and delete milestones that belong to it.
              </span>
              <span className="block">
                Milestones you added yourself outside of a generated plan are not removed by this action.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel>
            <Button
              className="rounded-full"
              onClick={() => runGenerate()}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Replacing…
                </>
              ) : (
                "Replace and build"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CareerOverview;
