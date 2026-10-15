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

function Generic() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-stage">
      <span className="font-mono text-sm text-muted">Aa</span>
    </div>
  );
}

const PREVIEWS: Record<string, () => ReactNode> = {
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
