import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, Users, Sparkles, ArrowRight, Search, Map } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OKRSection from "@/components/OKRSection";

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Search,
    title: "Tell us about yourself",
    description: "Answer 5 quick questions about your background, goals, and interests. Takes about 2 minutes.",
  },
  {
    step: "2",
    icon: Sparkles,
    title: "Get matched to careers",
    description: "Our AI finds career paths that fit your situation — with real data on salary, education, and timelines.",
  },
  {
    step: "3",
    icon: Map,
    title: "Build your plan",
    description: "Turn a career match into a step-by-step milestone plan and connect with a mentor who's been there.",
  },
];

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Compass className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground">UPath</span>
        </div>
        <div className="flex gap-2">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm">My Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-3 text-4xl font-bold leading-tight text-foreground md:text-5xl">
          Your career path,<br className="hidden sm:block" /> made clear
        </h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Free career guidance for students and young adults. Explore options, build a real plan, and connect with mentors who care.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full px-8 text-base gap-2">
                  Go to my dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                  Explore careers
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="rounded-full px-8 text-base gap-2">
                  Get started — it's free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>
        {!isAuthenticated && (
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Takes 3 minutes to set up</p>
        )}
        <OKRSection />
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-16">
        <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          How it works
        </h2>
        <div className="flex flex-col gap-4">
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="flex items-start gap-4 rounded-2xl bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">Step {step}</p>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {!isAuthenticated && (
          <div className="mt-8 text-center">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 gap-2">
                Start now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Landing;
