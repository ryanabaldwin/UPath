import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Target } from "lucide-react";
import { CAREER_PATH_OVERVIEWS, type CareerPathId } from "@/data/careerPathOverviews";

const slugFromTitle = (title: string): CareerPathId | null => {
  const normalized = title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) return null;

  return normalized as CareerPathId;
};

const CareerOverview = () => {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug as CareerPathId | undefined;

  const overview = useMemo(() => {
    if (slug && CAREER_PATH_OVERVIEWS[slug]) return CAREER_PATH_OVERVIEWS[slug];
    return null;
  }, [slug]);

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
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
            {overview.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{overview.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{overview.tagline}</p>
          </div>
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
    </div>
  );
};

export default CareerOverview;

