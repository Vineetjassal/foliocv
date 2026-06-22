export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      className={className}
      alt="FolioCV logo"
      style={{ objectFit: "contain" }}
    />
  );
}
