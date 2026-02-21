import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";

export default function DemoUserSelector() {
  const { user, users, setUserId, isLoading } = useDemoIdentity();

  if (isLoading || users.length === 0) return null;

  return (
    <Select value={user?.id ?? ""} onValueChange={(v) => setUserId(v || null)}>
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <SelectValue placeholder="Choose profile" />
      </SelectTrigger>
      <SelectContent>
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id} className="text-sm">
            {u.user_first} {u.user_last}
            {u.goal_title ? ` · ${u.goal_title}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
