import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ExternalLink, Bookmark, BookmarkCheck, Info } from "lucide-react";
import { resources as mockResources } from "@/data/mockData";
import {
  fetchResources,
  fetchUserBookmarks,
  addBookmark,
  removeBookmark,
  type Resource as ApiResource,
} from "@/lib/api";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { toast } from "sonner";
import {
  PARTICIPANT_INTEREST_OPTIONS,
  type ParticipantCareerArea,
} from "@/constants/participantInterests";

/** Resource category values for API / DB alignment (tabs also use "All"). */
export type ResourceCategory = "Scholarships" | "Jobs" | "Internships" | "College";

export type { ParticipantCareerArea };

const categories = ["All", "Scholarships", "Jobs", "Internships", "College"] as const;

type ResourceItem = ApiResource & {
  career_areas?: ParticipantCareerArea[];
};

const Resources = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoIdentity();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("All");
  const [careerFilter, setCareerFilter] = useState<"all" | ParticipantCareerArea>("all");

  const { data: apiResources, isError: apiError } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetchResources(),
    retry: false,
  });

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
    // Items with no career_areas still show for any career filter until the API sends tags.
    const hasAreas = r.career_areas && r.career_areas.length > 0;
    const matchesCareer =
      careerFilter === "all" ||
      !hasAreas ||
      r.career_areas!.includes(careerFilter);
    return matchesSearch && matchesTab && matchesCareer;
  });

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

      <div>
        <label htmlFor="resources-career-area" className="mb-2 block text-sm font-medium text-foreground">
          Career area
        </label>
        <Select
          value={careerFilter}
          onValueChange={(v) => setCareerFilter(v as "all" | ParticipantCareerArea)}
        >
          <SelectTrigger id="resources-career-area" className="w-full max-w-md rounded-xl">
            <SelectValue placeholder="Filter by area" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All areas
            </SelectItem>
            {PARTICIPANT_INTEREST_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                <span className="mr-2">{opt.icon}</span>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                          {r.career_areas?.map((area) => (
                            <Badge key={area} variant="secondary" className="text-xs font-normal">
                              {area}
                            </Badge>
                          ))}
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
