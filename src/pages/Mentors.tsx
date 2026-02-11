import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mentors } from "@/data/mockData";

const Mentors = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Mentors</h1>
      <p className="text-muted-foreground">Connect with people who care about your future</p>
    </div>

    <div className="space-y-4">
      {mentors.map((m) => (
        <Card key={m.id} className="overflow-hidden">
          <CardContent className="flex items-start gap-4 p-5">
            <Avatar className="h-14 w-14 shrink-0 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {m.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{m.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {m.specialty}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              <Button size="sm" className="mt-3 rounded-full">
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Mentors;
