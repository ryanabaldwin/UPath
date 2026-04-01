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
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center px-5 py-4">
        <div className="flex items-center gap-2">
          <Compass className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-white">UPath</span>
        </div>
      </header>

      {/* Hero Section with Image */}
      <section className="relative min-h-[500px] lg:min-h-[550px] bg-slate-900">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900" />
        
        {/* Desktop image - flush with top, parallelogram from right */}
        <div className="hidden lg:block absolute top-0 right-0 w-[50%] h-full">
          <div 
            className="relative h-full w-full overflow-hidden"
            style={{ clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          >
            <img
              src="/boy-studying.jpg"
              alt="Student studying and planning their future"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 lg:pt-24 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center lg:min-h-[400px]">
            {/* Left: Text content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                Your career path<br />
                <span className="text-primary">made clear</span>
              </h1>
              
              <p className="mb-8 max-w-lg text-lg text-slate-300">
                Free career guidance for students and young adults. Explore options, build a real plan, and connect with mentors who care.
              </p>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
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
                      <Button size="lg" className="rounded-full px-8 text-base gap-2 shadow-lg shadow-primary/25">
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
            </div>

            {/* Right: Image - shown on mobile only in grid */}
            <div className="relative order-1 lg:order-2 lg:hidden">
              <div 
                className="relative h-64 w-full overflow-hidden shadow-2xl"
                style={{ clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
              >
                <img
                  src="/boy-studying.jpg"
                  alt="Student studying and planning their future"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OKR Metrics Section */}
      <OKRSection />

      {/* How it works */}
      <section className="bg-background pt-10 pb-20">
        <div className="mx-auto w-full max-w-3xl px-6">
          <h2 className="mb-2 text-center text-4xl font-bold text-foreground">
            How it works
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Get from confused to confident in three simple steps
          </p>
          
          <div className="flex flex-col gap-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="flex items-start gap-4 rounded-xl bg-card p-6 border border-border/60">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Step {step}</p>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA with Image */}
      <section className="relative">
        <div className="grid lg:grid-cols-2">
          {/* Image side */}
          <div className="relative h-64 lg:h-auto lg:min-h-[300px] overflow-hidden">
            <img
              src="/cheerful-kids.webp"
              alt="Happy students achieving their goals"
              className="absolute inset-0 w-full h-full object-cover scale-110 object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
          </div>

          {/* Content side */}
          <div className="relative p-8 lg:p-16 lg:py-20 flex flex-col justify-center bg-background">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to find your path?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Join thousands of students who've discovered their career direction. It's completely free, and you can start right now.
            </p>
            
            {isAuthenticated ? (
              <Link to="/dashboard" className="inline-block">
                <Button size="lg" className="rounded-full px-8 gap-2">
                  Go to dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/25">
                    Get started free <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center bg-slate-900">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Compass className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">UPath</span>
        </div>
        <p className="text-xs text-slate-400">
          Helping students find their way since 2024
        </p>
      </footer>
    </div>
  );
};

export default Landing;
