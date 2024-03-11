export default function Double({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="9.5"
      fill="none"
      className={className}
    >
      <line
        x1="0"
        y1="2"
        x2="100%"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="8"
        x2="100%"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
