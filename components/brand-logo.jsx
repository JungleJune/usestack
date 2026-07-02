export function BrandMark({ className = "h-7 w-7" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 32 32"
      fill="none"
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M8.25 11.25 16 7l7.75 4.25L16 15.5l-7.75-4.25Z"
        stroke="white"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m8.25 16 7.75 4.25L23.75 16M8.25 20.75 16 25l7.75-4.25"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandLogo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-black ${className}`}>
      <BrandMark />
      <span className="text-[17px] font-semibold leading-none tracking-normal">
        UseStack
      </span>
    </span>
  );
}
