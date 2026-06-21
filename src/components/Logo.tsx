export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 80 40"
      width={size}
      height={size / 2}
      className={className}
      fill="currentColor"
      aria-label="FolioCV logo"
    >
      {/*
        Wavy M mark — smooth bezier squiggle with two rounded humps.
        Traced to match the uploaded logo: starts bottom-left, rises to first
        peak, dips to valley, rises to second peak, descends bottom-right.
        Stroke rendered as a filled thick path for crispness at all sizes.
      */}
      <path d="
        M 4 34
        C 4 34, 4 10, 14 10
        C 20 10, 22 20, 26 26
        C 28 29, 30 32, 32 32
        C 34 32, 36 29, 38 26
        C 42 20, 44 10, 50 10
        C 60 10, 60 34, 60 34
        C 60 34, 60 22, 54 22
        C 50 22, 48 30, 44 34
        C 42 36, 40 38, 38 36
        C 36 34, 34 28, 32 28
        C 30 28, 28 34, 26 36
        C 24 38, 22 36, 20 34
        C 16 30, 14 22, 10 22
        C 4 22, 4 34, 4 34
        Z
      " />
    </svg>
  );
}
