'use client';

interface SortSelectProps {
  value: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export function SortSelect({ value }: SortSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort', e.target.value);
    url.searchParams.delete('page');
    window.location.href = url.toString();
  };

  return (
    <select
      defaultValue={value}
      onChange={handleChange}
      className="input text-sm py-2 pr-8 cursor-pointer"
      aria-label="Sort products"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
