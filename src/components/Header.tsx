import { UserRole } from '@/types/recon';
import { RoleSelector } from './RoleSelector';
import { Activity } from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function Header({ activeRole, onRoleChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">TradeRecon</h1>
              <p className="text-xs text-muted-foreground">Reconciliation Platform</p>
            </div>
          </div>

          <RoleSelector activeRole={activeRole} onRoleChange={onRoleChange} />
        </div>
      </div>
    </header>
  );
}
