import { UserRole } from '@/types/recon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Settings, Shield, Users } from 'lucide-react';

interface RoleSelectorProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roleConfig: Record<UserRole, { label: string; icon: typeof User }> = {
  recon: {
    label: 'Recon User',
    icon: User,
  },
  ops: {
    label: 'Ops User',
    icon: Settings,
  },
  admin: {
    label: 'Admin User',
    icon: Shield,
  },
  recon_lead: {
    label: 'Recon Lead',
    icon: Users,
  },
};

export function RoleSelector({ activeRole, onRoleChange }: RoleSelectorProps) {
  const ActiveIcon = roleConfig[activeRole].icon;

  return (
    <Select value={activeRole} onValueChange={(value) => onRoleChange(value as UserRole)}>
      <SelectTrigger className="w-[200px] bg-secondary border-border">
        <div className="flex items-center gap-2">
          <ActiveIcon className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Select role" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {(Object.keys(roleConfig) as UserRole[]).map((role) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          return (
            <SelectItem
              key={role}
              value={role}
              className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <p className="font-medium">{config.label}</p>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
