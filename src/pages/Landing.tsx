import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, Users, Sparkles, ArrowRight } from "lucide-react";

const Landing = () => (
  <div className="flex min-h-screen flex-col bg-background">
    {/* Header */}
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2">
        <Compass className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold text-foreground">PathFinder</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">Sign In</Button>
        <Button size="sm">Register</Button>
      </div>
    </header>

    {/* Hero */}
    <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mb-3 text-4xl font-bold leading-tight text-foreground md:text-5xl">
        Find Your Path
      </h1>
      <p className="mb-8 max-w-md text-lg text-muted-foreground">
        Make your dreams a reality. Explore careers, connect with mentors, and unlock opportunities — all in one place.
      </p>
      <Link to="/explore">
        <Button size="lg" className="rounded-full px-8 text-base gap-2">
          Who are you? <ArrowRight className="h-5 w-5" />
        </Button>
      </Link>
    </section>

    {/* Steps Preview */}
    <section className="mx-auto grid max-w-2xl gap-6 px-6 pb-16 md:grid-cols-2">
      <div className="flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
        <Compass className="mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Find Your Passion</h3>
        <p className="text-sm text-muted-foreground">Take a quiz, explore paths, and discover what excites you most.</p>
      </div>
      <div className="flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
        <Users className="mb-4 h-12 w-12 text-secondary" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Connect with a Mentor</h3>
        <p className="text-sm text-muted-foreground">Get guidance from real people who've walked in your shoes.</p>
      </div>
    </section>
  </div>
);

export default Landing;
