export function Weight({ weight }: { weight: number }) {
  if (process.env.VERCEL_ENV === "production") {
    return null;
  }

  return (
    <span className="tabular-nums text-base/6 text-zinc-400 sm:text-sm/6 dark:text-zinc-500">
      {`${weight}.`}
    </span>
  );
}
