export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-product rounded-lg bg-sage-light/20 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-sage-light/20 rounded w-1/3" />
        <div className="h-4 bg-sage-light/20 rounded w-4/5" />
        <div className="h-4 bg-sage-light/20 rounded w-2/3" />
        <div className="h-5 bg-sage-light/20 rounded w-1/2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
