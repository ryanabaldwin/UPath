import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Result = {
  label: string;
  value: number;
};

/** Keep display copy in sync even if an older API build is still running */
function displayLabel(label: string): string {
  if (label === "Students exploring careers") return "Students served";
  return label;
}

type OKR = {
  objective: string;
  results: Result[];
};

export default function OKRSection() {
  const [okr, setOkr] = useState<OKR | null>(null);

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_BASE_URL}/api/okr`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then((data) => setOkr(data))
        .catch(() => {
          setOkr({
            objective: "Empower underprivileged youth to explore career paths",
            results: [
              { label: "Students served", value: 1200 },
              { label: "Mentor connections", value: 350 },
              { label: "Milestones completed", value: 2800 },
            ],
          });
        });
    };
  
    // run once immediately
    fetchData();
  
    // then run every 5 seconds
    const interval = setInterval(fetchData, 5000);
  
    // cleanup (important)
    return () => clearInterval(interval);
  }, []);

  if (!okr) return null;

  return (
    <div className="bg-gray-50 pt-12 pb-8 px-6 text-center">
      <h2 className="text-4xl font-bold mb-2">Our Impact</h2>
      <p className="text-lg text-muted-foreground mb-4">See how we're empowering youth on their career journey</p>
      <div className="w-32 h-1 bg-primary mx-auto mb-8 rounded-full" />

      <div className="mx-auto max-w-4xl rounded-xl border border-border/60 bg-white/80 px-6 py-10 md:px-10 md:py-12">
        <div className="flex flex-col md:flex-row items-start justify-center gap-10 md:gap-12 lg:gap-16">
          {okr.results.map((r, i) => (
            <div key={i} className="flex w-full md:w-auto flex-col items-center md:flex-1">
              <div className="w-32 h-32 shrink-0 rounded-full border-4 border-primary/30 flex items-center justify-center mb-4">
                <p className="text-3xl font-bold text-primary">
                  {r.value.toLocaleString()}+
                </p>
              </div>
              <p className="text-base md:text-lg font-semibold text-foreground max-w-[200px] leading-snug">
                {displayLabel(r.label)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}