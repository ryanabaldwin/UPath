import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ExternalLink, Bookmark, BookmarkCheck, Info, ChevronDown } from "lucide-react";
import { resources as mockResources } from "@/data/mockData";
import {
  fetchResources,
  fetchUserBookmarks,
  fetchUserPreferences,
  addBookmark,
  removeBookmark,
  type Resource as ApiResource,
} from "@/lib/api";
import { parseCareerAreasFromInterests } from "@/lib/careerInterestPreferences";
import { resourceMatchesCareerFilter, resourceCareerTags } from "@/lib/resourceCareerTags";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  PARTICIPANT_INTEREST_OPTIONS,
  type ParticipantCareerArea,
} from "@/constants/participantInterests";
import { cn } from "@/lib/utils";

/** Resource category values for API / DB alignment (tabs also use "All"). */
export type ResourceCategory = "Scholarships" | "Jobs" | "Internships" | "College";

export type { ParticipantCareerArea };

const categories = ["All", "Scholarships", "Jobs", "Internships", "College"] as const;

type ResourceItem = ApiResource & {
  career_areas?: ParticipantCareerArea[];
};

function careerAreasSummary(areas: ParticipantCareerArea[]): string {
  if (areas.length === 0) return "All areas";
  if (areas.length <= 2) return areas.join(", ");
  return `${areas.slice(0, 2).join(", ")} +${areas.length - 2}`;
}

const Resources = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("All");
  const [selectedAreas, setSelectedAreas] = useState<ParticipantCareerArea[]>([]);
  const [areasPopoverOpen, setAreasPopoverOpen] = useState(false);

  const { data: apiResources, isError: apiError } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetchResources(),
    retry: false,
  });

  const { data: prefs } = useQuery({
    queryKey: ["preferences", userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
    retry: false,
  });

  useEffect(() => {
    if (!userId) {
      setSelectedAreas([]);
      return;
    }
    if (prefs === undefined) {
      setSelectedAreas([]);
      return;
    }
    setSelectedAreas(parseCareerAreasFromInterests(prefs.interests));
  }, [userId, prefs]);

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks", userId],
    queryFn: () => fetchUserBookmarks(userId!),
    enabled: !!userId,
    retry: false,
  });

  const addBookmarkMutation = useMutation({
    mutationFn: (resourceId: number) => addBookmark(userId!, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Saved to your list");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (resourceId: number) => removeBookmark(userId!, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Removed from your list");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isUsingMockData = apiError || !apiResources?.length;

  const resources: ResourceItem[] = isUsingMockData
    ? mockResources.map((r) => ({
        resource_id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        link: r.link,
        career_areas: r.career_areas,
      }))
    : (apiResources as ResourceItem[]);

  const bookmarkIds = new Set(bookmarks.map((b) => b.resource_id));

  const filtered = resources.filter((r) => {
    const desc = r.description ?? "";
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "All" || r.category === tab;
    const matchesCareer = resourceMatchesCareerFilter(r, selectedAreas);
    return matchesSearch && matchesTab && matchesCareer;
  });

  const toggleArea = (area: ParticipantCareerArea) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground">
          Scholarships, internships, jobs, and college info — all in one place
        </p>
      </div>

      {isUsingMockData && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Showing example resources — the live database isn't connected. Refresh or check your backend to load real data.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground">Career areas</p>
          <p className="text-xs text-muted-foreground">
            {userId
              ? "Checklist starts from your profile interests. Changes here only filter this page (they are not saved)."
              : "Choose one or more areas to narrow the list. Sign in to start from your profile interests."}
          </p>
        </div>
        <Popover open={areasPopoverOpen} onOpenChange={setAreasPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("w-full max-w-md justify-between rounded-xl font-normal")}
              id="resources-career-areas"
              aria-expanded={areasPopoverOpen}
            >
              <span className="truncate text-left">{careerAreasSummary(selectedAreas)}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-md p-0" align="start">
            <div className="max-h-72 overflow-y-auto p-3 space-y-2">
              {PARTICIPANT_INTEREST_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selectedAreas.includes(opt.value)}
                    onCheckedChange={() => toggleArea(opt.value)}
                    aria-label={opt.label}
                  />
                  <span className="text-sm">
                    <span className="mr-1.5">{opt.icon}</span>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1">
          {categories.map((c) => (
            <TabsTrigger key={c} value={c} className="rounded-lg text-xs">
              {c}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((c) => (
          <TabsContent key={c} value={c} className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No resources found.</p>
            ) : (
              filtered.map((r) => {
                const isBookmarked = userId ? bookmarkIds.has(r.resource_id) : false;
                return (
                  <Card key={r.resource_id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{r.title}</h3>
                          {r.link && (
                            <a
                              href={r.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Open link"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {r.description ?? ""}
                        </p>
                        {(r.education_level || r.location || r.cost_usd != null) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {r.education_level ? `Education: ${r.education_level}` : "Education: any"}
                            {" · "}
                            {r.location ? `Location: ${r.location}` : "Location: flexible"}
                            {" · "}
                            {r.cost_usd == null ? "Cost: varies" : `Cost: $${r.cost_usd}`}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {r.category}
                          </Badge>
                          {r.industry ? (
                            <Badge variant="secondary" className="text-xs font-normal">
                              Industry · {r.industry}
                            </Badge>
                          ) : (
                            resourceCareerTags(r).map((area) => (
                              <Badge key={area} variant="secondary" className="text-xs font-normal">
                                {area}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      {userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() =>
                            isBookmarked
                              ? removeBookmarkMutation.mutate(r.resource_id)
                              : addBookmarkMutation.mutate(r.resource_id)
                          }
                          disabled={addBookmarkMutation.isPending || removeBookmarkMutation.isPending}
                          aria-label={isBookmarked ? "Remove bookmark" : "Save"}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Resources;
