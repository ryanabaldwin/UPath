import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  GraduationCap,
  TrendingUp,
  Clock,
  DollarSign,
  Heart,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

interface CareerPath {
  title: string;
  emoji: string;
  description: string;
  salaryRange: string;
  growthRate: string;
  education: string;
  timeToEntry: string;
  matchScore: number;
  skills: string[];
  dayInLife: string[];
  resources: { title: string; type: string }[];
  mentorName: string;
  mentorAvatar: string;
  mentorRole: string;
}

const careers: CareerPath[] = [
  {
    title: "Software Development",
    emoji: "💻",
    description:
      "Build apps, websites, and tools that millions of people use every day. Software developers solve real-world problems with code and creativity.",
    salaryRange: "$70K – $150K+",
    growthRate: "25% growth",
    education: "Bootcamp, Associate's, or Bachelor's",
    timeToEntry: "6 months – 4 years",
    matchScore: 92,
    skills: ["Problem Solving", "JavaScript", "Teamwork", "Creativity", "Communication"],
    dayInLife: [
      "Morning standup with your team to plan the day",
      "Write and review code for a new feature",
      "Lunch & learn session on a cool new tool",
      "Pair-program with a teammate to fix a tricky bug",
      "Ship your code and see it live! 🎉",
    ],
    resources: [
      { title: "freeCodeCamp", type: "Free Course" },
      { title: "CS50 by Harvard", type: "Free Course" },
      { title: "Google IT Support Certificate", type: "Certificate" },
    ],
    mentorName: "Sarah Johnson",
    mentorAvatar: "SJ",
    mentorRole: "Senior Engineer",
  },
  {
    title: "Healthcare",
    emoji: "🩺",
    description:
      "Make a direct impact on people's lives by helping them stay healthy. Healthcare careers range from nursing to therapy to public health.",
    salaryRange: "$45K – $120K+",
    growthRate: "13% growth",
    education: "Certificate, Associate's, or Bachelor's",
    timeToEntry: "1 – 6 years",
    matchScore: 85,
    skills: ["Empathy", "Attention to Detail", "Science", "Communication", "Resilience"],
    dayInLife: [
      "Review patient charts and prepare for rounds",
      "Check in with patients and update care plans",
      "Collaborate with doctors and specialists",
      "Educate a patient's family on recovery steps",
      "Document notes and wrap up the shift",
    ],
    resources: [
      { title: "Khan Academy – Health & Medicine", type: "Free Course" },
      { title: "CNA Certification Programs", type: "Certificate" },
      { title: "Pre-Med Pathway Guide", type: "Guide" },
    ],
    mentorName: "Priya Patel",
    mentorAvatar: "PP",
    mentorRole: "Nurse Practitioner",
  },
  {
    title: "Business & Entrepreneurship",
    emoji: "🚀",
    description:
      "Turn your ideas into reality. Whether you want to start your own business or lead teams at a company, this path is all about impact and innovation.",
    salaryRange: "$50K – $130K+",
    growthRate: "8% growth",
    education: "Self-taught, Associate's, or Bachelor's",
    timeToEntry: "Anytime – start now!",
    matchScore: 78,
    skills: ["Leadership", "Marketing", "Financial Literacy", "Negotiation", "Adaptability"],
    dayInLife: [
      "Plan your week and set priorities",
      "Meet with a client or pitch a new idea",
      "Analyze sales data and adjust strategy",
      "Network at a community event",
      "Brainstorm your next big product idea 💡",
    ],
    resources: [
      { title: "SCORE Free Mentoring", type: "Mentorship" },
      { title: "Coursera – Business Foundations", type: "Free Course" },
      { title: "Young Entrepreneurs Academy", type: "Program" },
    ],
    mentorName: "Aaliyah Brooks",
    mentorAvatar: "AB",
    mentorRole: "Small Business Owner",
  },
];

const CareerDetails = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/explore"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Your Career Matches</h1>
        <p className="mt-1 text-muted-foreground">
          Based on your interests, here are some paths worth exploring ✨
        </p>
      </div>

      {/* Career Cards */}
      {careers.map((career) => (
        <Card key={career.title} className="overflow-hidden">
          {/* Title & Match */}
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{career.emoji}</span>
                <div>
                  <CardTitle className="text-lg">{career.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{career.description}</p>
                </div>
              </div>
            </div>
            {/* Match score */}
            <div className="mt-4 rounded-xl bg-primary/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Heart className="h-4 w-4 text-primary" />
                  Match Score
                </span>
                <span className="font-bold text-primary">{career.matchScore}%</span>
              </div>
              <Progress value={career.matchScore} className="mt-2 h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: DollarSign, label: "Salary", value: career.salaryRange },
                { icon: TrendingUp, label: "Job Growth", value: career.growthRate },
                { icon: GraduationCap, label: "Education", value: career.education },
                { icon: Clock, label: "Time to Entry", value: career.timeToEntry },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card p-3 text-center"
                >
                  <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Key Skills</h4>
              <div className="flex flex-wrap gap-2">
                {career.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-full text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Day in the Life */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                📅 A Day in the Life
              </h4>
              <ol className="space-y-2 pl-1">
                {career.dayInLife.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Resources */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Get Started
              </h4>
              <div className="space-y-2">
                {career.resources.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.type}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor CTA */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-primary/5 p-4">
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {career.mentorAvatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{career.mentorName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {career.mentorRole} · Available to mentor
                </p>
              </div>
              <Button size="sm" className="shrink-0 rounded-full" asChild>
                <Link to="/mentors">Connect</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Bottom CTA */}
      <div className="rounded-xl bg-primary/5 p-6 text-center">
        <Briefcase className="mx-auto mb-2 h-8 w-8 text-primary" />
        <h3 className="font-semibold text-foreground">Ready to take the next step?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a goal, connect with a mentor, or explore resources.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button className="rounded-full" asChild>
            <Link to="/milestones">Set a Goal</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/resources">Browse Resources</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CareerDetails;
