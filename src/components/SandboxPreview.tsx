"use client";
import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

type Props = {
  title: string;
  srcDoc: string;
  className: string;
  sandbox: string;
  referrerPolicy?: "no-referrer";
};

export function SandboxPreview(props: Props) {
  // A document gets one fresh frame and one delivery, even if it later navigates.
  return <PreviewFrame key={props.srcDoc} {...props} />;
}

function PreviewFrame({ title, srcDoc, className, sandbox }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function deliver(event: MessageEvent) {
      if (
        event.source !== frame.current?.contentWindow ||
        event.origin !== "null" ||
        event.data !== "lexicon-preview-ready" ||
        event.ports.length !== 1
      )
        return;
      window.removeEventListener("message", deliver);
      event.ports[0].postMessage(srcDoc);
      event.ports[0].close();
    }
    window.addEventListener("message", deliver);
    setReady(true);
    return () => window.removeEventListener("message", deliver);
  }, [srcDoc]);
  return (
    <iframe
      ref={frame}
      title={title}
      className={className}
      sandbox={
        sandbox === "allow-scripts allow-forms" ? sandbox : "allow-scripts"
      }
      referrerPolicy="no-referrer"
      src={ready ? withBasePath("/preview-frame/") : undefined}
    />
  );
}
