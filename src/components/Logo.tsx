export function Logo({ size = 40 }: { size?: number }) {
  const scale = size / 56;
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-archivo), sans-serif",
          fontWeight: 800,
          fontSize: size,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        renewmere
      </span>
      <svg
        width={360 * scale}
        height={16 * scale}
        viewBox="0 0 360 16"
        style={{ marginTop: 4 * scale }}
        role="img"
        aria-label="Renewmere"
      >
        <path
          d="M0,8 C55,-1 104,17 159,7 C214,-3 270,14 360,6"
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
