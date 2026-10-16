import type { ReactNode } from "react";

/**
 * Decorative mini-illustrations, one per component id.
 * Everything is sized in %, so the same drawing works in a 52px thumbnail and a 320px stage.
 * An id with no illustration falls back to a neutral placeholder, so new content never breaks the UI.
 */

function Page({ dim = false, lines = true, children }: { dim?: boolean; lines?: boolean; children?: ReactNode }) {
  return (
    <div className="absolute inset-0 bg-stage">
      {lines && (
        <>
          <div className="absolute left-[6%] top-[14%] h-[7%] w-[40%] rounded-full bg-skel" />
          <div className="absolute left-[6%] top-[30%] h-[5%] w-[55%] rounded-full bg-skel-soft" />
          <div className="absolute left-[6%] top-[42%] h-[5%] w-[48%] rounded-full bg-skel-soft" />
        </>
      )}
      {dim && <div className="absolute inset-0 bg-ink/40" />}
      {children}
    </div>
  );
}

function Bar({ w, tone = "rule" }: { w: number; tone?: "ink" | "rule" | "stage" }) {
  const color = { ink: "bg-ink", rule: "bg-rule", stage: "bg-stage" }[tone];
  return <div className={`h-[7%] shrink-0 rounded-full ${color}`} style={{ width: `${w}%` }} />;
}

function Drawer() {
  return (
    <Page dim>
      <div className="absolute inset-y-0 right-0 flex w-[46%] flex-col gap-[7%] bg-surface p-[5%] shadow-[-8px_0_24px_rgba(16,24,40,0.18)]">
        <Bar w={60} tone="ink" />
        <Bar w={90} />
        <Bar w={75} />
        <Bar w={85} />
      </div>
    </Page>
  );
}

function Modal() {
  return (
    <Page dim>
      <div className="absolute inset-x-[22%] inset-y-[17%] flex flex-col gap-[9%] rounded-xl bg-surface p-[5%]">
        <Bar w={45} tone="ink" />
        <Bar w={85} />
        <div className="mt-auto flex h-[22%] justify-end gap-[8%]">
          <div className="w-[32%] rounded-md bg-rule" />
          <div className="w-[32%] rounded-md bg-accent" />
        </div>
      </div>
    </Page>
  );
}

function Popover() {
  return (
    <Page lines={false}>
      <div className="absolute left-[8%] top-[14%] h-[14%] w-[26%] rounded-lg bg-accent" />
      <div className="absolute left-[8%] top-[34%] h-[46%] w-[52%] rounded-lg border border-rule bg-surface p-[4%]">
        <div className="absolute -top-1 left-[16%] size-2 rotate-45 border-l border-t border-rule bg-surface" />
        <div className="flex h-full flex-col gap-[10%]">
          <Bar w={55} tone="ink" />
          <Bar w={90} />
          <Bar w={70} />
        </div>
      </div>
    </Page>
  );
}

function BottomSheet() {
  return (
    <Page dim>
      <div className="absolute inset-x-[5%] bottom-0 flex h-[52%] flex-col gap-[9%] rounded-t-xl bg-surface p-[4%]">
        <div className="mx-auto h-[7%] w-[16%] shrink-0 rounded-full bg-rule" />
        <Bar w={50} tone="ink" />
        <Bar w={88} />
      </div>
    </Page>
  );
}

function Toast() {
  return (
    <Page>
      <div className="absolute bottom-[10%] right-[6%] flex w-[46%] items-center gap-[8%] rounded-lg bg-ink px-[4%] py-[3.5%]">
        <div className="aspect-square w-[12%] shrink-0 rounded-full bg-hi" />
        <div className="h-1 flex-1 rounded-full bg-rule" />
      </div>
    </Page>
  );
}

function Skeleton() {
  return (
    <div className="absolute inset-0 bg-stage">
      <div className="absolute inset-x-[6%] inset-y-[14%] flex gap-[5%] rounded-xl bg-surface p-[5%]">
        <div className="aspect-square h-[46%] shrink-0 rounded-full bg-rule" />
        <div className="flex flex-1 flex-col gap-[10%]">
          <Bar w={55} />
          <Bar w={85} tone="stage" />
          <Bar w={70} tone="stage" />
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-0 top-0 flex h-[28%] items-center justify-between bg-surface px-[5%]">
        <div className="aspect-square h-[46%] rounded-md bg-accent" />
        <div className="flex w-[38%] gap-[5%]">
          <div className="h-1 flex-1 rounded-full bg-skel" />
          <div className="h-1 flex-1 rounded-full bg-skel" />
          <div className="h-1 flex-1 rounded-full bg-skel" />
        </div>
        <div className="h-[46%] w-[14%] rounded-full bg-ink" />
      </div>
      <div className="absolute left-[6%] top-[46%] h-[7%] w-[40%] rounded-full bg-skel" />
      <div className="absolute left-[6%] top-[62%] h-[5%] w-[55%] rounded-full bg-skel-soft" />
    </Page>
  );
}

function Hamburger() {
  return (
    <Page lines={false}>
      <div className="absolute left-1/2 top-1/2 flex aspect-square h-[50%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[9%] rounded-2xl bg-surface">
        <div className="h-[7%] w-[44%] rounded-full bg-ink" />
        <div className="h-[7%] w-[44%] rounded-full bg-ink" />
        <div className="h-[7%] w-[44%] rounded-full bg-ink" />
      </div>
    </Page>
  );
}

function SwitchRow({ on }: { on: boolean }) {
  return (
    <div className="flex h-[26%] items-center justify-between rounded-lg bg-surface px-[6%]">
      <div className="h-[22%] w-[40%] rounded-full bg-rule" />
      <div className={`relative aspect-[9/5] h-[56%] rounded-full ${on ? "bg-accent" : "bg-rule"}`}>
        <div className={`absolute top-[10%] aspect-square h-[80%] rounded-full bg-surface ${on ? "right-[6%]" : "left-[6%]"}`} />
      </div>
    </div>
  );
}

function Toggle() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[16%] inset-y-[18%] flex flex-col justify-center gap-[10%]">
        <SwitchRow on />
        <SwitchRow on={false} />
      </div>
    </Page>
  );
}

function Tabs() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[10%] inset-y-[16%] rounded-lg bg-surface p-[5%]">
        <div className="flex h-[30%] gap-[6%] border-b border-rule">
          <div className="w-[28%] border-b-2 border-accent bg-accent-soft" />
          <div className="w-[28%] rounded-t-md bg-stage" />
          <div className="w-[28%] rounded-t-md bg-stage" />
        </div>
        <div className="mt-[8%] flex h-[45%] flex-col gap-[20%]">
          <Bar w={65} tone="ink" />
          <Bar w={90} />
          <Bar w={75} />
        </div>
      </div>
    </Page>
  );
}

function Breadcrumb() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[8%] top-[25%] flex h-[12%] items-center gap-[6%]">
        <div className="h-[35%] w-[20%] rounded-full bg-accent" />
        <div className="aspect-square h-[40%] rotate-45 border-r-2 border-t-2 border-skel" />
        <div className="h-[35%] w-[25%] rounded-full bg-accent" />
        <div className="aspect-square h-[40%] rotate-45 border-r-2 border-t-2 border-skel" />
        <div className="h-[35%] w-[20%] rounded-full bg-ink" />
      </div>
      <div className="absolute left-[8%] top-[55%] h-[8%] w-[56%] rounded-full bg-skel" />
    </Page>
  );
}

function Tooltip() {
  return (
    <Page lines={false}>
      <div className="absolute left-[25%] top-[19%] flex h-[24%] w-[50%] items-center justify-center rounded-lg bg-ink">
        <div className="h-[15%] w-[66%] rounded-full bg-surface" />
        <div className="absolute -bottom-[12%] left-[47%] aspect-square w-[6%] rotate-45 bg-ink" />
      </div>
      <div className="absolute left-[35%] top-[55%] h-[24%] w-[30%] rounded-lg bg-accent" />
    </Page>
  );
}

function Accordion() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[12%] inset-y-[12%] flex flex-col gap-[6%]">
        <div className="relative flex h-[56%] flex-col gap-[14%] rounded-lg bg-surface p-[5%]">
          <Bar w={60} tone="ink" />
          <div className="absolute right-[8%] top-[20%] aspect-square w-[5%] rotate-45 border-l-2 border-t-2 border-accent" />
          <Bar w={82} />
          <Bar w={70} />
        </div>
        {[0, 1].map((row) => (
          <div key={row} className="flex h-[18%] items-center justify-between rounded-md bg-surface px-[5%]">
            <div className="h-[20%] w-[55%] rounded-full bg-skel" />
            <div className="aspect-square w-[5%] rotate-45 border-b-2 border-r-2 border-muted" />
          </div>
        ))}
      </div>
    </Page>
  );
}

function DropdownMenu() {
  return (
    <Page lines={false}>
      <div className="absolute left-[24%] top-[10%] flex h-[17%] w-[44%] items-center justify-between rounded-md bg-accent px-[5%]">
        <div className="h-[20%] w-[65%] rounded-full bg-surface" />
        <div className="aspect-square w-[12%] rotate-45 border-b-2 border-r-2 border-surface" />
      </div>
      <div className="absolute left-[24%] top-[32%] flex h-[57%] w-[52%] flex-col gap-[12%] rounded-lg border border-rule bg-surface p-[4%]">
        <div className="flex h-[28%] items-center rounded-sm bg-accent-soft px-[8%]">
          <div className="h-[20%] w-[65%] rounded-full bg-accent" />
        </div>
        <Bar w={64} />
        <Bar w={78} />
      </div>
    </Page>
  );
}

function Card() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[25%] inset-y-[10%] flex flex-col gap-[9%] rounded-lg border border-rule bg-surface p-[4%]">
        <div className="h-[38%] rounded-md bg-accent-soft" />
        <Bar w={70} tone="ink" />
        <Bar w={90} />
        <div className="mt-auto h-[14%] w-[48%] rounded-md bg-accent" />
      </div>
    </Page>
  );
}

function Button() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[23%] top-[33%] flex h-[34%] items-center justify-center rounded-lg bg-accent">
        <div className="h-[14%] w-[48%] rounded-full bg-surface" />
      </div>
    </Page>
  );
}

function TextInput() {
  return (
    <Page lines={false}>
      <div className="absolute left-[13%] top-[24%] h-[6%] w-[27%] rounded-full bg-ink" />
      <div className="absolute inset-x-[13%] top-[39%] flex h-[30%] items-center gap-[4%] rounded-md border-2 border-accent bg-surface px-[5%]">
        <div className="h-[15%] w-[40%] rounded-full bg-skel" />
        <div className="h-[48%] w-[1%] bg-ink" />
      </div>
      <div className="absolute left-[13%] top-[77%] h-[4%] w-[45%] rounded-full bg-skel" />
    </Page>
  );
}

function Checkbox() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[20%] inset-y-[22%] flex flex-col gap-[22%]">
        {[true, false].map((checked) => (
          <div key={String(checked)} className="flex h-[38%] items-center gap-[12%]">
            <div className={`flex aspect-square h-full items-center justify-center rounded-sm ${checked ? "bg-accent" : "border-2 border-skel bg-surface"}`}>
              {checked && <div className="mb-[15%] h-[52%] w-[28%] rotate-45 border-b-2 border-r-2 border-surface" />}
            </div>
            <div className="h-[18%] flex-1 rounded-full bg-skel" />
          </div>
        ))}
      </div>
    </Page>
  );
}

function ProgressBar() {
  return (
    <Page lines={false}>
      <div className="absolute left-[14%] top-[30%] h-[6%] w-[34%] rounded-full bg-ink" />
      <div className="absolute inset-x-[14%] top-[47%] h-[13%] overflow-hidden rounded-full bg-surface">
        <div className="h-full w-[65%] rounded-full bg-accent" />
      </div>
      <div className="absolute right-[14%] top-[70%] h-[5%] w-[15%] rounded-full bg-skel" />
    </Page>
  );
}

function Pagination() {
  return (
    <Page>
      <div className="absolute inset-x-[12%] bottom-[14%] flex h-[21%] items-center justify-center gap-[5%]">
        {[false, true, false, false].map((active, index) => (
          <div key={index} className={`flex aspect-square h-full items-center justify-center rounded-md ${active ? "bg-accent" : "bg-surface"}`}>
            <div className={`h-[35%] w-[12%] rounded-full ${active ? "bg-surface" : "bg-skel"}`} />
          </div>
        ))}
      </div>
    </Page>
  );
}

function Sidebar() {
  return (
    <Page lines={false}>
      <div className="absolute inset-y-0 left-0 flex w-[32%] flex-col gap-[9%] border-r border-rule bg-surface p-[4%]">
        <Bar w={70} tone="ink" />
        <div className="h-[14%] rounded-sm bg-accent-soft" />
        <Bar w={80} />
        <Bar w={65} />
      </div>
      <div className="absolute left-[40%] top-[20%] h-[8%] w-[35%] rounded-full bg-skel" />
      <div className="absolute left-[40%] top-[40%] h-[5%] w-[48%] rounded-full bg-skel-soft" />
      <div className="absolute left-[40%] top-[54%] h-[5%] w-[41%] rounded-full bg-skel-soft" />
    </Page>
  );
}

function Carousel() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[22%] top-[12%] flex h-[60%] flex-col justify-end gap-[12%] rounded-lg bg-surface p-[5%]">
        <div className="h-[38%] w-full rounded-md bg-accent-soft" />
        <Bar w={65} tone="ink" />
      </div>
      <div className="absolute left-[10%] top-[38%] aspect-square w-[4%] rotate-45 border-b-2 border-l-2 border-accent" />
      <div className="absolute right-[10%] top-[38%] aspect-square w-[4%] rotate-45 border-r-2 border-t-2 border-accent" />
      <div className="absolute inset-x-[35%] bottom-[12%] flex h-[6%] justify-center gap-[14%]">
        {[true, false, false].map((active, index) => <div key={index} className={`aspect-square h-full rounded-full ${active ? "bg-accent" : "bg-skel"}`} />)}
      </div>
    </Page>
  );
}

function Badge() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[12%] top-[32%] flex h-[36%] items-center justify-between rounded-lg bg-surface px-[6%]">
        <div className="h-[16%] w-[40%] rounded-full bg-skel" />
        <div className="flex h-[50%] w-[32%] items-center justify-center rounded-full bg-accent-soft">
          <div className="h-[20%] w-[60%] rounded-full bg-accent" />
        </div>
      </div>
    </Page>
  );
}

function Avatar() {
  return (
    <Page lines={false}>
      <div className="absolute left-[15%] top-1/2 aspect-square w-[24%] -translate-y-1/2 overflow-hidden rounded-full bg-accent-soft">
        <div className="absolute left-[35%] top-[18%] aspect-square w-[30%] rounded-full bg-accent" />
        <div className="absolute inset-x-[18%] bottom-0 h-[42%] rounded-t-full bg-accent" />
      </div>
      <div className="absolute left-[48%] top-[39%] h-[7%] w-[33%] rounded-full bg-ink" />
      <div className="absolute left-[48%] top-[56%] h-[5%] w-[25%] rounded-full bg-skel" />
    </Page>
  );
}

function Radio() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[20%] inset-y-[22%] flex flex-col gap-[22%]">
        {[true, false].map((selected) => (
          <div key={String(selected)} className="flex h-[38%] items-center gap-[12%]">
            <div className={`flex aspect-square h-full items-center justify-center rounded-full border-2 bg-surface ${selected ? "border-accent" : "border-skel"}`}>
              {selected && <div className="aspect-square w-[50%] rounded-full bg-accent" />}
            </div>
            <div className="h-[18%] flex-1 rounded-full bg-skel" />
          </div>
        ))}
      </div>
    </Page>
  );
}

function Slider() {
  return (
    <Page lines={false}>
      <div className="absolute left-[14%] top-[24%] h-[6%] w-[30%] rounded-full bg-ink" />
      <div className="absolute inset-x-[14%] top-[52%] h-[6%] rounded-full bg-surface">
        <div className="h-full w-[60%] rounded-full bg-accent" />
      </div>
      <div className="absolute left-[52%] top-[45%] aspect-square h-[20%] rounded-full border-2 border-accent bg-surface" />
      <div className="absolute right-[14%] bottom-[20%] h-[5%] w-[12%] rounded-full bg-skel" />
    </Page>
  );
}

function Select() {
  return (
    <Page lines={false}>
      <div className="absolute left-[16%] top-[12%] h-[5%] w-[25%] rounded-full bg-ink" />
      <div className="absolute inset-x-[16%] top-[25%] flex h-[23%] items-center justify-between rounded-md border border-accent bg-surface px-[5%]">
        <div className="h-[18%] w-[48%] rounded-full bg-skel" />
        <div className="aspect-square w-[6%] rotate-45 border-b-2 border-r-2 border-accent" />
      </div>
      <div className="absolute inset-x-[16%] top-[53%] flex h-[35%] flex-col gap-[18%] rounded-md bg-surface p-[4%]">
        <div className="h-[24%] w-full rounded-sm bg-accent-soft" />
        <Bar w={52} />
        <Bar w={64} />
      </div>
    </Page>
  );
}

function Spinner() {
  return (
    <Page lines={false}>
      <svg viewBox="0 0 100 100" className="absolute left-[38%] top-[16%] aspect-square w-[24%]" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-skel-soft" />
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" pathLength="100" strokeDasharray="25 75" transform="rotate(-90 50 50)" className="stroke-accent" />
      </svg>
      <div className="absolute inset-x-[35%] bottom-[15%] h-[5%] rounded-full bg-skel" />
    </Page>
  );
}

function Alert() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[8%] top-[18%] flex h-[42%] items-center gap-[8%] rounded-lg border border-accent bg-accent-soft px-[5%]">
        <div className="flex aspect-square h-[46%] shrink-0 flex-col items-center justify-center gap-[12%] rounded-full bg-accent">
          <div className="h-[34%] w-[10%] rounded-full bg-surface" />
          <div className="aspect-square w-[10%] rounded-full bg-surface" />
        </div>
        <div className="flex h-[48%] flex-1 flex-col justify-around">
          <Bar w={62} tone="ink" />
          <Bar w={90} />
        </div>
      </div>
      <div className="absolute left-[8%] bottom-[20%] h-[5%] w-[55%] rounded-full bg-skel" />
    </Page>
  );
}

function DatePicker() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[25%] inset-y-[10%] flex flex-col gap-[12%] rounded-lg bg-surface p-[4%]">
        <div className="h-[10%] w-[55%] rounded-full bg-ink" />
        <div className="grid flex-1 grid-cols-7 grid-rows-4 gap-[8%]">
          {Array.from({ length: 28 }, (_, index) => <div key={index} className={`rounded-sm ${index === 16 ? "bg-accent" : "bg-stage"}`} />)}
        </div>
      </div>
    </Page>
  );
}

function EmptyState() {
  return (
    <Page lines={false}>
      <div className="absolute left-[42%] top-[16%] aspect-square w-[16%] rounded-lg border-2 border-skel bg-surface" />
      <div className="absolute inset-x-[28%] top-[59%] h-[6%] rounded-full bg-skel" />
      <div className="absolute inset-x-[38%] bottom-[12%] h-[14%] rounded-md bg-accent" />
    </Page>
  );
}

function HeroSection() {
  return (
    <Page lines={false}>
      <div className="absolute left-[8%] top-[20%] h-[10%] w-[40%] rounded-full bg-ink" />
      <div className="absolute left-[8%] top-[36%] h-[10%] w-[32%] rounded-full bg-ink" />
      <div className="absolute left-[8%] top-[57%] h-[5%] w-[37%] rounded-full bg-skel" />
      <div className="absolute left-[8%] bottom-[13%] h-[14%] w-[21%] rounded-md bg-accent" />
      <div className="absolute inset-y-[16%] right-[8%] flex w-[35%] items-center justify-center rounded-xl bg-accent-soft">
        <div className="aspect-square w-[55%] rotate-12 rounded-lg bg-accent" />
      </div>
    </Page>
  );
}

function Footer() {
  return (
    <Page>
      <div className="absolute inset-x-0 bottom-0 flex h-[35%] items-center justify-between border-t border-rule bg-surface px-[6%]">
        <div className="h-[16%] w-[25%] rounded-full bg-ink" />
        <div className="flex h-[60%] w-[45%] items-center gap-[10%]">
          {[0, 1, 2].map((index) => <div key={index} className="h-[16%] flex-1 rounded-full bg-skel" />)}
        </div>
      </div>
    </Page>
  );
}

function StickyHeader() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-0 top-0 flex h-[27%] items-center justify-between border-b-2 border-accent bg-surface px-[6%]">
        <div className="h-[25%] w-[22%] rounded-full bg-accent" />
        <div className="h-[16%] w-[33%] rounded-full bg-skel" />
      </div>
      <div className="absolute left-[8%] top-[43%] h-[7%] w-[42%] rounded-full bg-skel" />
      <div className="absolute left-[8%] top-[61%] h-[5%] w-[60%] rounded-full bg-skel-soft" />
      <div className="absolute left-[8%] top-[77%] h-[5%] w-[53%] rounded-full bg-skel-soft" />
      <div className="absolute right-[5%] top-[37%] h-[48%] w-[2%] rounded-full bg-skel-soft">
        <div className="absolute top-[32%] h-[35%] w-full rounded-full bg-muted" />
      </div>
    </Page>
  );
}

function BentoGrid() {
  return (
    <Page lines={false}>
      <div className="absolute inset-[10%] grid grid-cols-3 grid-rows-2 gap-[7%]">
        <div className="col-span-2 rounded-lg bg-accent-soft" />
        <div className="rounded-lg bg-surface" />
        <div className="rounded-lg bg-surface" />
        <div className="col-span-2 rounded-lg bg-accent" />
      </div>
    </Page>
  );
}

function CommandPalette() {
  return (
    <Page dim>
      <div className="absolute inset-x-[18%] inset-y-[12%] flex flex-col gap-[10%] rounded-lg bg-surface p-[4%]">
        <div className="flex h-[25%] items-center gap-[8%] border-b border-rule">
          <svg viewBox="0 0 24 24" className="h-[70%] w-[14%] shrink-0 stroke-muted" fill="none" strokeWidth="2" aria-hidden="true">
            <circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" />
          </svg>
          <div className="h-[18%] w-[55%] rounded-full bg-skel" />
        </div>
        <div className="flex h-[23%] items-center rounded-sm bg-accent-soft px-[5%]">
          <div className="h-[20%] w-[65%] rounded-full bg-accent" />
        </div>
        <Bar w={70} />
        <Bar w={55} />
      </div>
    </Page>
  );
}

function Stepper() {
  return (
    <Page lines={false}>
      <svg viewBox="0 0 100 45" className="absolute inset-x-[10%] inset-y-[15%] h-[70%] w-[80%]" aria-hidden="true">
        <path d="M18 18H82" className="stroke-skel" strokeWidth="2" />
        <path d="M18 18H50" className="stroke-accent" strokeWidth="2" />
        <circle cx="18" cy="18" r="8" className="fill-accent" />
        <circle cx="50" cy="18" r="8" className="fill-accent-soft stroke-accent" strokeWidth="2" />
        <circle cx="82" cy="18" r="8" className="fill-surface stroke-skel" strokeWidth="2" />
        <path d="m14 18 3 3 5-6" fill="none" className="stroke-surface" strokeWidth="2" />
        {[10, 42, 74].map((x) => <rect key={x} x={x} y="33" width="16" height="3" rx="1.5" className="fill-skel" />)}
      </svg>
    </Page>
  );
}

function DataTable() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[10%] inset-y-[15%] flex flex-col overflow-hidden rounded-lg border border-rule bg-surface">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className={`grid h-[25%] grid-cols-3 items-center gap-[10%] px-[6%] ${row === 0 ? "bg-accent-soft" : "border-t border-line"}`}>
            {[0, 1, 2].map((col) => <div key={col} className={`h-[15%] rounded-full ${row === 0 ? "bg-accent" : "bg-skel"}`} />)}
          </div>
        ))}
      </div>
    </Page>
  );
}

function KebabMenu() {
  return (
    <Page lines={false}>
      <div className="absolute left-[16%] top-[25%] flex h-[45%] w-[15%] flex-col items-center justify-center gap-[12%] rounded-lg bg-surface">
        {[0, 1, 2].map((index) => <div key={index} className="aspect-square w-[12%] rounded-full bg-ink" />)}
      </div>
      <div className="absolute left-[37%] top-[25%] flex h-[55%] w-[47%] flex-col gap-[16%] rounded-lg border border-rule bg-surface p-[5%]">
        <Bar w={68} tone="ink" />
        <Bar w={85} />
        <Bar w={60} />
      </div>
    </Page>
  );
}

function FileUpload() {
  return (
    <Page lines={false}>
      <div className="absolute inset-x-[14%] inset-y-[14%] rounded-lg border-2 border-dashed border-skel bg-surface">
        <svg viewBox="0 0 24 24" className="absolute left-[40%] top-[12%] h-[40%] w-[20%] stroke-accent" fill="none" strokeWidth="2" aria-hidden="true">
          <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />
        </svg>
        <div className="absolute inset-x-[24%] top-[62%] h-[5%] rounded-full bg-skel" />
        <div className="absolute inset-x-[36%] bottom-[10%] h-[13%] rounded-sm bg-accent" />
      </div>
    </Page>
  );
}

function Generic() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-stage">
      <span className="font-mono text-sm text-muted">Aa</span>
    </div>
  );
}

const PREVIEWS: Record<string, () => ReactNode> = {
  "date-picker": DatePicker,
  "empty-state": EmptyState,
  "hero-section": HeroSection,
  footer: Footer,
  "sticky-header": StickyHeader,
  "bento-grid": BentoGrid,
  "command-palette": CommandPalette,
  stepper: Stepper,
  "data-table": DataTable,
  "kebab-menu": KebabMenu,
  "file-upload": FileUpload,
  pagination: Pagination,
  sidebar: Sidebar,
  carousel: Carousel,
  badge: Badge,
  avatar: Avatar,
  radio: Radio,
  slider: Slider,
  select: Select,
  spinner: Spinner,
  alert: Alert,
  tabs: Tabs,
  breadcrumb: Breadcrumb,
  tooltip: Tooltip,
  accordion: Accordion,
  "dropdown-menu": DropdownMenu,
  card: Card,
  button: Button,
  "text-input": TextInput,
  checkbox: Checkbox,
  "progress-bar": ProgressBar,
  drawer: Drawer,
  modal: Modal,
  popover: Popover,
  "bottom-sheet": BottomSheet,
  toast: Toast,
  "skeleton-loader": Skeleton,
  navbar: Navbar,
  "hamburger-icon": Hamburger,
  "toggle-switch": Toggle,
};

export function Preview({ id }: { id: string }) {
  const Art = PREVIEWS[id] ?? Generic;
  return (
    <div className="relative h-full w-full overflow-hidden bg-stage">
      <Art />
    </div>
  );
}
