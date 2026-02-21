import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { careerPaths } from "@/data/mockData";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { fetchUserPreferences, putUserPreferences } from "@/lib/api";

const Explore = () => {
  const { userId } = useDemoIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [interests, setInterests] = useState("");

  const { data: prefs } = useQuery({
    queryKey: ["preferences", userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
    retry: false,
  });

  useEffect(() => {
    if (prefs) {
      if (Array.isArray(prefs.selected_career_paths)) setSelected(prefs.selected_career_paths);
      if (prefs.interests != null) setInterests(prefs.interests);
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: () => putUserPreferences(userId!, { interests, selected_career_paths: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", userId] });
    },
  });

  const toggle = (path: string) =>
    setSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Explore Your Future</h1>
        <p className="mt-1 text-muted-foreground">What career paths interest you?</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {careerPaths.map((path) => (
          <button
            key={path}
            onClick={() => toggle(path)}
            className={cn(
              "rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
              selected.includes(path)
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {path}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-center text-sm font-medium text-foreground">
          Tell us more about your interests ✨
        </label>
        <Textarea
          placeholder="I love building things, solving puzzles, helping people..."
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          className="min-h-[120px] rounded-xl resize-none"
        />
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          className="rounded-full px-10"
          disabled={selected.length === 0 && !interests}
          onClick={() => {
            if (userId) {
              saveMutation.mutate(undefined, {
                onSettled: () => {
                  navigate("/careers", {
                    state: { selectedPaths: selected, interests },
                  });
                },
              });
            } else {
              navigate("/careers", {
                state: { selectedPaths: selected, interests },
              });
            }
          }}
        >
          {saveMutation.isPending ? "Saving…" : "Find My Path"}
        </Button>
      </div>
    </div>
  );
};

export default Explore;
