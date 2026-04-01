import { useEffect, useState } from "react";

type Result = {
  label: string;
  value: number;
};

type OKR = {
  objective: string;
  results: Result[];
};

export default function OKRSection() {
  const [okr, setOkr] = useState<OKR | null>(null);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:4000/api/okr")
        .then((res) => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then((data) => setOkr(data))
        .catch(() => {
          setOkr({
            objective: "Empower underprivileged youth to explore career paths",
            results: [
              { label: "Students exploring careers", value: 1200 },
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
    <div className="bg-gray-50 py-12 px-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Our Impact</h2>

      <p className="text-lg mb-8">{okr.objective}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {okr.results.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <p className="text-3xl font-bold text-primary">
              {r.value.toLocaleString()}+
            </p>
            <p className="text-sm text-gray-600 mt-2">{r.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}