type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({
  className = "h-10 w-10",
  title,
}: BrandMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      className={className}
      role={title ? "img" : undefined}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <rect fill="#0A122A" height="64" rx="16" width="64" />
      <path
        d="M24 14h16M27 14v11.2c0 1.7-.5 3.4-1.4 4.9L15.8 47.2A5.2 5.2 0 0 0 20.3 55h23.4a5.2 5.2 0 0 0 4.5-7.8L38.4 30a9.5 9.5 0 0 1-1.4-4.8V14"
        fill="none"
        stroke="#EEEBD3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M20.5 41h23"
        fill="none"
        stroke="#F26419"
        strokeLinecap="round"
        strokeWidth="4"
      />
    </svg>
  );
}
