import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";
import { resources } from "@/data/mockData";

const categories = ["All", "Scholarships", "Jobs", "College"] as const;

const Resources = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("All");

  const filtered = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "All" || r.category === tab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground">Scholarships, jobs, and college info — all in one place</p>
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
              filtered.map((r) => (
                <Card key={r.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{r.title}</h3>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {r.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Resources;
