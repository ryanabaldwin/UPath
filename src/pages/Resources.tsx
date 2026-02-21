import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
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

const categories = ["All", "Scholarships", "Jobs", "College"] as const;

type ResourceItem = ApiResource | { resource_id: number; title: string; description: string; category: string; link: string };

const Resources = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoIdentity();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("All");

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

  const resources: ResourceItem[] = apiError || !apiResources?.length
    ? mockResources.map((r) => ({
        resource_id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        link: r.link,
      }))
    : apiResources;

  const bookmarkIds = new Set(bookmarks.map((b) => b.resource_id));

  const filtered = resources.filter((r) => {
    const desc = r.description ?? "";
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "All" || r.category === tab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground">
          Scholarships, jobs, and college info — all in one place
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start rounded-xl">
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
                        <Badge variant="outline" className="mt-2 text-xs">
                          {r.category}
                        </Badge>
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
