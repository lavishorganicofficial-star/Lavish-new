import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { Users, Search } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Customers | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const supabase = await createAdminClient();
  const { q, page } = await searchParams;
  const currentPage = Number(page ?? 1);
  const pageSize = 20;

  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, created_at, role', { count: 'exact' })
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  if (q) query = query.ilike('full_name', `%${q}%`);

  const { data: customersData, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  // Fetch emails from auth.users since they aren't in the profiles table
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authUsers.map(u => [u.id, u.email]));

  const customers = customersData?.map(c => ({
    ...c,
    email: emailMap.get(c.id) ?? 'No Email',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Customers</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{count ?? 0} registered customers</p>
        </div>
      </div>

      <div className="card p-4">
        <form className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
            <input name="q" defaultValue={q} placeholder="Search by name or email..." className="input pl-9 w-full" />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sage-light/20 bg-sage-50/50">
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Phone</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Joined</th>
                <th className="text-left p-4 text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {customers?.map((customer) => (
                <tr key={customer.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center text-sage-dark font-semibold text-sm">
                        {(customer.full_name ?? customer.email ?? 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{customer.full_name ?? '—'}</p>
                        <p className="text-xs text-charcoal-lighter">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-charcoal-lighter">{customer.phone ?? '—'}</td>
                  <td className="p-4 text-xs text-charcoal-lighter">
                    {new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <Link href={`/admin/customers/${customer.id}`} className="btn-secondary text-xs py-1 px-2.5">View Orders</Link>
                  </td>
                </tr>
              ))}
              {!customers?.length && (
                <tr><td colSpan={4} className="p-12 text-center">
                  <Users className="w-10 h-10 text-sage-light mx-auto mb-3" />
                  <p className="text-charcoal-lighter text-sm">No customers found.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-sage-light/20 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-charcoal-lighter">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              {currentPage > 1 && <Link href={`?page=${currentPage - 1}${q ? `&q=${q}` : ''}`} className="btn-secondary text-sm py-1.5 px-3">Previous</Link>}
              {currentPage < totalPages && <Link href={`?page=${currentPage + 1}${q ? `&q=${q}` : ''}`} className="btn-primary text-sm py-1.5 px-3">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
