export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Wavy M monogram */}
      <path d="M6 42c0-10 6-18 14-18 5 0 8 3 12 9 4 6 7 9 12 9 8 0 14-8 14-18 0 14-6 24-14 24-5 0-8-3-12-9-4-6-7-9-12-9-8 0-14 8-14 24v-12z" />
    </svg>
  );
}
