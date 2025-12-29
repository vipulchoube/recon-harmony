import { UserRole } from '@/types/recon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Settings, Shield } from 'lucide-react';

interface RoleSelectorProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roleConfig = {
  recon: {
    label: 'Recon User',
    icon: User,
    description: 'View reconciliation dashboard',
  },
  ops: {
    label: 'Ops User',
    icon: Settings,
    description: 'Manage cases & exceptions',
  },
  admin: {
    label: 'Admin User',
    icon: Shield,
    description: 'Upload files & configure',
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
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
