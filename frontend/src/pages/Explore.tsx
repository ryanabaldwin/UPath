import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { exploreCareerSections } from "@/data/mockData";
import { CAREER_PATH_OVERVIEWS } from "@/data/careerPathOverviews";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Explore = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Explore Your Future</h1>
        <p className="mx-auto mt-1 max-w-2xl text-muted-foreground">
          Browse career paths and compare them at a glance—roles, training, and typical pay and timelines. Open a path for
          the full story, then build a personalized milestone plan from the career page.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exploreCareerSections.map(({ slug }) => {
          const o = CAREER_PATH_OVERVIEWS[slug];
          return (
            <li key={slug}>
              <Card className="flex h-full flex-col border-border transition-shadow hover:shadow-md">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none" aria-hidden>
                      {o.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold leading-tight text-foreground">{o.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{o.tagline}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 pb-4">
                  <div className="grid gap-2 rounded-lg border border-border/80 bg-muted/30 p-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Salary range</p>
                      <p className="mt-0.5 line-clamp-2 font-medium text-foreground">{o.salaryRange}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time to entry</p>
                      <p className="mt-0.5 line-clamp-2 text-foreground">{o.timeToEntry}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="secondary" className="w-full rounded-full">
                    <Link to={`/paths/${slug}`}>Learn more</Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Explore;
