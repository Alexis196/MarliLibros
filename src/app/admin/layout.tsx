import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/supabase-server';
import { getPendingDispatchCount } from '@/lib/admin-stats';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminProviders } from '@/components/admin/AdminProviders';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect('/login');

  const pendingDispatch = await getPendingDispatchCount();

  return (
    <div className="min-h-screen flex flex-col sm:flex-row" style={{ background: '#F7F6F2' }}>
      <AdminSidebar email={user.email ?? ''} pendingDispatch={pendingDispatch} />
      <AdminProviders>
        {/* pb-20 on mobile leaves room above the bottom nav bar */}
        <main className="flex-1 min-w-0 p-5 pb-24 sm:pb-8 sm:p-8 sm:ml-60 print:ml-0 print:p-0">{children}</main>
      </AdminProviders>
    </div>
  );
}
