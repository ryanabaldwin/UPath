import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMentors, bookMentor, unbookMentor, fetchUserMeetings, type Mentor } from "@/lib/api";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { toast } from "sonner";

function avatarInitials(m: Mentor) {
  const first = m.mentor_first?.[0] ?? "";
  const last = m.mentor_last?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function MentorCard({
  mentor,
  onBook,
  onUnbook,
  isBooking,
  isUnbooking,
  canBook,
}: {
  mentor: Mentor;
  onBook: (id: number) => void;
  onUnbook: (id: number) => void;
  isBooking: boolean;
  isUnbooking: boolean;
  canBook: boolean;
}) {
  const available = mentor.is_available;

  return (
    <Card key={mentor.mentor_id} className="overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <Avatar className="h-14 w-14 shrink-0 text-lg">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {avatarInitials(mentor)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">
                {mentor.mentor_first} {mentor.mentor_last}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {mentor.specialty && (
                  <Badge variant="secondary" className="text-xs">
                    {mentor.specialty}
                  </Badge>
                )}
                <Badge variant={available ? "default" : "secondary"} className="text-xs">
                  {available ? "Available" : "Booked"}
                </Badge>
              </div>
            </div>
          </div>
          {mentor.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {mentor.description}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {available ? (
              <Button
                size="sm"
                className="rounded-full"
                disabled={!canBook || isBooking}
                onClick={() => onBook(mentor.mentor_id)}
              >
                {isBooking ? "Booking…" : "Book Now"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={!canBook || isUnbooking}
                onClick={() => onUnbook(mentor.mentor_id)}
              >
                {isUnbooking ? "Cancelling…" : "Cancel Booking"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MentorCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

const Mentors = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoIdentity();
  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["mentors"],
    queryFn: fetchMentors,
  });
  const { data: myMeetings = [] } = useQuery({
    queryKey: ["user-meetings", userId],
    queryFn: () => fetchUserMeetings(userId!),
    enabled: !!userId,
  });

  const bookMutation = useMutation({
    mutationFn: (mentorId: number) => bookMentor(mentorId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      queryClient.invalidateQueries({ queryKey: ["user-meetings", userId] });
      toast.success("Mentor booked successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to book mentor");
    },
  });

  const unbookMutation = useMutation({
    mutationFn: (mentorId: number) => unbookMentor(mentorId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      queryClient.invalidateQueries({ queryKey: ["user-meetings", userId] });
      toast.success("Booking cancelled.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel booking");
    },
  });

  const canBook = !!userId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mentors</h1>
        <p className="text-muted-foreground">
          Connect with people who care about your future
        </p>
      </div>

      {myMeetings.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">My mentor sessions</h2>
          <ul className="space-y-2">
            {myMeetings.map((m) => (
              <li key={`${m.mentor_id}-${m.time}`} className="flex items-center justify-between text-sm">
                <span>
                  {m.mentor_first} {m.mentor_last}
                  {m.specialty && <span className="text-muted-foreground"> · {m.specialty}</span>}
                  <span className="block text-muted-foreground text-xs">
                    {new Date(m.time).toLocaleString()}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unbookMutation.mutate(m.mentor_id)}
                  disabled={unbookMutation.isPending}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <MentorCardSkeleton key={i} />)
        ) : (
          mentors.map((m) => (
            <MentorCard
              key={m.mentor_id}
              mentor={m}
              onBook={(id) => bookMutation.mutate(id)}
              onUnbook={(id) => unbookMutation.mutate(id)}
              isBooking={bookMutation.isPending}
              isUnbooking={unbookMutation.isPending}
              canBook={canBook}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Mentors;
