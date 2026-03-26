import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type UserRole } from "@/types/user";
import { MoreHorizontal } from "lucide-react";

interface TeamMemberRowProps {
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export function TeamMemberRow({ name, email, role, avatarUrl }: TeamMemberRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} alt={name} fallback={name.charAt(0)} />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-neutral-500">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs bg-neutral-100 rounded-full px-2.5 py-1 capitalize">
          {role.replace("_", " ")}
        </span>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
