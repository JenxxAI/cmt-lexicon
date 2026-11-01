"use client";
import { useEffect, useState } from "react";

export function RequestStatus({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!pending) return;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [pending]);
  if (!pending) return null;
  return (
    <p role="status" className="my-4 text-sm text-muted">
      {children}
      {slow && (
        <span className="mt-1 block">
          This is taking longer than usual. You can keep your work here while we
          wait. If the request times out, check your connection and try again.
        </span>
      )}
    </p>
  );
}
