import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { submitOnboarding } from "@/lib/api";
import { toast } from "sonner";
import { PARTICIPANT_INTEREST_OPTIONS } from "@/constants/participantInterests";

interface StepOption {
  value: string;
  label: string;
  icon: string;
}

interface Step {
  id: string;
  question: string;
  subtitle: string;
  type: "single" | "multi";
  maxSelect?: number;
  options: StepOption[];
}

const STEPS: Step[] = [
  {
    id: "background",
    question: "What best describes you?",
    subtitle: "Help us personalize your experience from the start.",
    type: "single",
    options: [
      { value: "High school student", label: "High school student", icon: "🎒" },
      { value: "College student", label: "College student", icon: "🎓" },
      { value: "Recent graduate", label: "Recent graduate", icon: "📜" },
      { value: "Working professional", label: "Working professional", icon: "💼" },
      { value: "Career changer", label: "Career changer", icon: "🔄" },
    ],
  },
  {
    id: "goal",
    question: "What's your main goal?",
    subtitle: "We'll tailor your path around what matters most to you.",
    type: "single",
    options: [
      { value: "get-into-college", label: "Get into college or a program", icon: "🏫" },
      { value: "land-first-job", label: "Land my first job", icon: "🚀" },
      { value: "switch-careers", label: "Switch to a new career", icon: "↔️" },
      { value: "build-skills", label: "Build new skills", icon: "🛠️" },
      { value: "not-sure", label: "Explore my options", icon: "🧭" },
    ],
  },
  {
    id: "interests",
    question: "What fields interest you?",
    subtitle: "Pick up to 3 areas that excite you.",
    type: "multi",
    maxSelect: 3,
    options: PARTICIPANT_INTEREST_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
      icon: o.icon,
    })),
  },
  {
    id: "challenge",
    question: "What's your biggest challenge right now?",
    subtitle: "Be honest — this helps us focus on what you need most.",
    type: "single",
    options: [
      { value: "Don't know what I want", label: "I don't know what I want", icon: "🤔" },
      { value: "Need more skills", label: "I need more skills or experience", icon: "📖" },
      { value: "Finding opportunities", label: "Finding the right opportunities", icon: "🔍" },
      { value: "Need guidance", label: "I need better guidance or support", icon: "🧑‍🏫" },
      { value: "Limited time or resources", label: "Limited time or resources", icon: "⏰" },
    ],
  },
  {
    id: "weeklyTime",
    question: "How much time can you commit weekly?",
    subtitle: "We'll adjust your plan to fit your schedule.",
    type: "single",
    options: [
      { value: "Less than 5 hrs", label: "Less than 5 hours", icon: "⚡" },
      { value: "5–10 hrs", label: "5–10 hours", icon: "📅" },
      { value: "10+ hrs", label: "10+ hours", icon: "💪" },
      { value: "Not sure yet", label: "Not sure yet", icon: "🤷" },
    ],
  },
];

type Answers = {
  background: string;
  goal: string;
  interests: string[];
  challenge: string;
  weeklyTime: string;
};

const emptyAnswers: Answers = {
  background: "",
  goal: "",
  interests: [],
  challenge: "",
  weeklyTime: "",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { getPendingRegistration, register, clearPendingRegistration, isAuthenticated } = useAuth();
  const { userId, users, setUserId, isLoading: isDemoLoading, refetchUsers } = useDemoIdentity();
  
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [visible, setVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingRegistration = getPendingRegistration();
  const isNewRegistration = !!pendingRegistration;

  useEffect(() => {
    if (!isNewRegistration && !userId && !isDemoLoading && users.length === 0) {
      toast.error("Please start from the registration page");
      navigate("/register");
    }
  }, [isNewRegistration, userId, isDemoLoading, users.length, navigate]);

  const currentStep = STEPS[step];
  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const getCurrentValue = (): string | string[] => {
    const id = currentStep.id as keyof Answers;
    return answers[id];
  };

  const isStepComplete = (): boolean => {
    const val = getCurrentValue();
    if (Array.isArray(val)) return val.length > 0;
    return val !== "";
  };

  const handleSelect = (value: string) => {
    const id = currentStep.id as keyof Answers;
    if (currentStep.type === "multi") {
      const current = answers.interests;
      const max = currentStep.maxSelect ?? 3;
      if (current.includes(value)) {
        setAnswers((prev) => ({ ...prev, interests: current.filter((v) => v !== value) }));
      } else if (current.length < max) {
        setAnswers((prev) => ({ ...prev, interests: [...current, value] }));
      }
    } else {
      setAnswers((prev) => ({ ...prev, [id]: value }));
    }
  };

  const isSelected = (value: string): boolean => {
    const val = getCurrentValue();
    if (Array.isArray(val)) return val.includes(value);
    return val === value;
  };

  const isMultiAtMax = (): boolean => {
    if (currentStep.type !== "multi") return false;
    return answers.interests.length >= (currentStep.maxSelect ?? 3);
  };

  const animateTransition = (callback: () => void) => {
    setVisible(false);
    setTimeout(() => {
      callback();
      setVisible(true);
    }, 180);
  };

  const handleNext = () => {
    if (!isStepComplete()) return;
    if (step < totalSteps - 1) {
      animateTransition(() => setStep((s) => s + 1));
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 0) {
      if (isNewRegistration) {
        navigate("/register");
      } else {
        navigate("/");
      }
      return;
    }
    animateTransition(() => setStep((s) => s - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const onboardingData = {
      background: answers.background,
      goal: answers.goal,
      interests: answers.interests,
      challenge: answers.challenge,
      weeklyTime: answers.weeklyTime,
    };

    try {
      if (isNewRegistration && pendingRegistration) {
        await register(pendingRegistration, onboardingData);
        refetchUsers();
        toast.success("Welcome! Your account is ready.");
        navigate("/dashboard");
      } else if (userId) {
        await submitOnboarding(userId, onboardingData);
        toast.success("Welcome! Your profile is set up.");
        navigate("/dashboard");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDemoLoading && !isNewRegistration) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <span className="text-base font-bold text-foreground">PathFinder</span>
        </div>
        {/* Show greeting for new registration */}
        {isNewRegistration && pendingRegistration && (
          <span className="text-sm text-muted-foreground">
            Hi, {pendingRegistration.firstName}!
          </span>
        )}
        {!isNewRegistration && users.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={userId ?? ""}
              onChange={(e) => setUserId(e.target.value || null)}
              className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.user_first} {u.user_last}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Step counter */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step + 1} of {totalSteps}
            </span>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-colors duration-300",
                    i < step
                      ? "bg-primary"
                      : i === step
                      ? "bg-primary/70"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Question card */}
          <div
            className="transition-all duration-200"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {currentStep.question}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{currentStep.subtitle}</p>
              {currentStep.type === "multi" && (
                <p className="mt-1 text-xs text-primary font-medium">
                  {answers.interests.length}/{currentStep.maxSelect} selected
                </p>
              )}
            </div>

            {/* Options grid */}
            <div
              className={cn(
                "grid gap-3",
                currentStep.type === "multi" ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              {currentStep.options.map((option) => {
                const selected = isSelected(option.value);
                const atMax = isMultiAtMax() && !selected;
                return (
                  <button
                    key={option.value}
                    onClick={() => !atMax && handleSelect(option.value)}
                    disabled={atMax}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : atMax
                        ? "border-border bg-muted/30 opacity-40 cursor-not-allowed"
                        : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    )}
                  >
                    <span className="text-2xl leading-none select-none">{option.icon}</span>
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium leading-snug",
                        selected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {option.label}
                    </span>
                    {selected && (
                      <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? (isNewRegistration ? "Back to registration" : "Back to home") : "Back"}
            </Button>

            <Button
              size="default"
              onClick={handleNext}
              disabled={!isStepComplete() || isSubmitting}
              className="gap-2 rounded-full px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {isNewRegistration ? "Creating account..." : "Saving..."}
                </>
              ) : step === totalSteps - 1 ? (
                <>
                  {isNewRegistration ? "Create account" : "Finish setup"}
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer note */}
      <footer className="pb-6 text-center">
        <p className="text-xs text-muted-foreground">
          Your answers help us build a personalized path just for you.
        </p>
      </footer>
    </div>
  );
}
