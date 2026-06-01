import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Reviews | LavishOrganic Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createAdminClient();
  const { status, page } = await searchParams;
  const currentPage = Number(page ?? 1);
  const pageSize = 20;

  let query = supabase
    .from('product_reviews')
    .select('id, rating, title, body, is_approved, created_at, product:products(name, slug), user:profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  if (status === 'pending') query = query.eq('is_approved', false);
  if (status === 'approved') query = query.eq('is_approved', true);

  const { data: reviews, count } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Reviews</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{count ?? 0} total reviews</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {[{ label: 'All', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' }].map((tab) => (
          <a
            key={tab.value}
            href={`?status=${tab.value}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${status === tab.value || (!status && !tab.value) ? 'bg-sage-dark text-white' : 'bg-sage-50 text-charcoal hover:bg-sage-100'}`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {reviews?.map((review) => (
          <div key={review.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-gold fill-gold' : 'text-sage-light/40'}`} />
                    ))}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.is_approved ? 'bg-sage-50 text-sage-dark' : 'bg-amber-50 text-amber-700'}`}>
                    {review.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <p className="font-medium text-charcoal text-sm mb-1">{review.title}</p>
                <p className="text-sm text-charcoal-lighter leading-relaxed">{review.body}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-charcoal-lighter">
                  <span>By {(review.user as unknown as { full_name: string } | null)?.full_name ?? 'Anonymous'}</span>
                  <span>·</span>
                  <span>On <strong className="text-charcoal">{(review.product as unknown as { name: string } | null)?.name ?? '—'}</strong></span>
                  <span>·</span>
                  <span>{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <form action={`/api/admin/reviews/${review.id}/approve`} method="POST">
                  <button type="submit" className="btn-icon text-sage-dark hover:bg-sage-50" aria-label="Approve review">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </form>
                <form action={`/api/admin/reviews/${review.id}/reject`} method="POST">
                  <button type="submit" className="btn-icon text-red-400 hover:text-red-600" aria-label="Reject review">
                    <XCircle className="w-4 h-4" />
                  </button>
                </form>
                <form action={`/api/admin/reviews/${review.id}/delete`} method="POST">
                  <button className="btn-icon text-red-400 hover:text-red-600" aria-label="Delete review">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {!reviews?.length && (
          <div className="card p-12 text-center">
            <Star className="w-10 h-10 text-sage-light mx-auto mb-3" />
            <p className="text-charcoal-lighter text-sm">No reviews found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
