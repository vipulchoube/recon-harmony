import { useState } from 'react';
import { UserRole } from '@/types/recon';
import { ReconProvider } from '@/context/ReconContext';
import { Header } from '@/components/Header';
import { ReconUserScreen } from '@/components/screens/ReconUserScreen';
import { OpsUserScreen } from '@/components/screens/OpsUserScreen';
import { AdminUserScreen } from '@/components/screens/AdminUserScreen';

const Index = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('ops');

  const renderScreen = () => {
    switch (activeRole) {
      case 'recon':
        return <ReconUserScreen />;
      case 'ops':
        return <OpsUserScreen />;
      case 'admin':
        return <AdminUserScreen />;
      default:
        return <OpsUserScreen />;
    }
  };

  return (
    <ReconProvider>
      <div className="min-h-screen bg-background">
        <Header activeRole={activeRole} onRoleChange={setActiveRole} />
        <main className="container mx-auto px-4 py-6 animate-fade-in">
          {renderScreen()}
        </main>
      </div>
    </ReconProvider>
  );
};

export default Index;
