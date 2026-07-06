import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMealPhotoUrl } from "@/lib/meals.functions";

export function MealPhoto({
  path,
  className,
  alt = "Meal",
}: {
  path: string;
  className?: string;
  alt?: string;
}) {
  const sign = useServerFn(getMealPhotoUrl);
  const [url, setUrl] = useState<string | null>(path.startsWith("http") ? path : null);

  useEffect(() => {
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    let cancelled = false;
    sign({ data: { path } })
      .then((r) => {
        if (!cancelled) setUrl(r.url);
      })
      .catch(() => setUrl(null));
    return () => {
      cancelled = true;
    };
  }, [path, sign]);

  if (!url)
    return (
      <div className={"animate-pulse rounded-lg bg-secondary " + (className ?? "h-40 w-full")} />
    );
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
