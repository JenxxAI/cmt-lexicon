"use client";

import Link from "next/link";
import { useState } from "react";
import { assembleSample, splitSample } from "@/lib/sample-source";
import { OpenFullPreview } from "./OpenFullPreview";

export function WebsiteSampleStudio({ initialCode, id, name }: { initialCode: string; id: string; name: string }) {
  const [phone, setPhone] = useState(false);
  const doc = assembleSample(initialCode, splitSample(initialCode));
  const control = "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold";
  return (
    <section aria-labelledby="sample-heading" className="mt-10 min-w-0 rounded-[28px] bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-deep">Interactive sample</p>
          <h2 id="sample-heading" className="mt-2 font-display text-2xl font-bold">See the blueprint come to life</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">Try the example here, or open the editor to change its code side by side with the preview.</p>
        </div>
        <Link href={`/websites/${id}/edit/`} className={`${control} bg-ink text-surface`}>Edit code →</Link>
      </div>
      <div className="my-4 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={phone} onClick={() => setPhone(!phone)} className={`${control} ${phone ? "bg-ink text-surface" : "bg-line hover:bg-rule"}`}>Phone preview</button>
        <OpenFullPreview title={name} getDocument={() => doc} className={`${control} bg-line hover:bg-rule`} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-rule bg-stage p-2 sm:p-6">
        {phone ? (
          <div className="mx-auto w-full max-w-[414px] rounded-[44px] border border-muted bg-ink p-2.5 shadow-xl">
            <iframe title={`${name} phone sample`} sandbox="allow-scripts allow-forms" srcDoc={doc} className="block h-[640px] w-full rounded-[28px] border-0 bg-paper" />
          </div>
        ) : (
          <iframe title={`${name} sample`} sandbox="allow-scripts allow-forms" srcDoc={doc} className="block h-[640px] w-full rounded-xl border-0 bg-paper" />
        )}
      </div>
    </section>
  );
}
