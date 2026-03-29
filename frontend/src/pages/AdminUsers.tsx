import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users } from "lucide-react";
import { fetchUsers, type AdminUser } from "@/lib/api";

export default function AdminUsers() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-destructive">Failed to load users. You may not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {users.length} registered {users.length === 1 ? "user" : "users"}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Name</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Role</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground hidden md:table-cell">Region</th>
                  <th className="pb-2 font-medium text-muted-foreground hidden lg:table-cell">Grade</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: AdminUser) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div>
                        <span className="font-medium text-foreground">
                          {u.user_first} {u.user_last}
                        </span>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground hidden sm:table-cell">
                      {u.email}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                      {u.user_region ?? "—"}
                    </td>
                    <td className="py-3 text-muted-foreground hidden lg:table-cell">
                      {u.current_grade_level ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
