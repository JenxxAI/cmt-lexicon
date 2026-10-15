import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-7 pb-16 text-sm text-muted">
      {SITE.name} is open source under the MIT license. Made by{" "}
      <a href={SITE.authorUrl} className="underline underline-offset-2 hover:text-accent">
        Miguel
      </a>
      .
    </footer>
  );
}
