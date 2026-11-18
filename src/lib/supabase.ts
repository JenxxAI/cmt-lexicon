import { withBasePath } from "./base-path";
import { communityFetch } from "./community-resilience";
import type { CommunitySession } from "./community-session";
import type { CommunityProject, CommunitySummary } from "./community";

type Result<T> = {
  data: T;
  error: { message: string; status?: number; code?: string } | null;
  count?: number;
};
type Listener = (event: string, session: CommunitySession | null) => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;
function notify(session: CommunitySession | null) {
  listeners.forEach((listener) =>
    listener(session ? "SIGNED_IN" : "SIGNED_OUT", session),
  );
}
async function request<T>(path: string, body?: unknown): Promise<Result<T>> {
  const response = await communityFetch(
    withBasePath(`/api/community/${path}`),
    {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    },
  );
  if (response.status === 401) notify(null);
  return response.json() as Promise<Result<T>>;
}
const client = {
  auth: {
    async getSession() {
      return request<{ session: CommunitySession | null }>("session/");
    },
    onAuthStateChange(listener: Listener) {
      listeners.add(listener);
      void this.getSession()
        .then((result) => {
          if (listeners.has(listener) && !result.error)
            listener("INITIAL_SESSION", result.data.session);
        })
        .catch(() => {});
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listeners.delete(listener);
            },
          },
        },
      };
    },
    async signInWithOAuth() {
      const result = await request<{ url: string }>("login/", {});
      if (!result.error) window.location.assign(result.data.url);
      return result;
    },
    async signOut() {
      const result = await request<null>("logout/", {});
      if (!result.error) {
        notify(null);
        channel?.postMessage("changed");
      }
      return result;
    },
  },
  async uploadPreview(path: string, image: Blob) {
    const encoded = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("Image could not be read"));
      reader.readAsDataURL(image);
    });
    return request<null>("image-upload/", { path, encoded, mime: image.type });
  },
  removePreviews(paths: string[]) {
    return request<null>("image-remove/", { paths });
  },
  projects(options: {
    view: string;
    page: number;
    kind: string;
    search: string;
  }) {
    return request<CommunitySummary[]>(
      `projects/?${new URLSearchParams({ ...options, page: String(options.page) })}`,
    );
  },
  project(id: string) {
    return request<CommunityProject>(`project/?${new URLSearchParams({ id })}`);
  },
  rpc(name: string, args?: Record<string, unknown>) {
    return request<unknown>("rpc/", { name, args });
  },
};
let initialized = false;
export type CommunityClient = typeof client;
export function getCommunityClient(): CommunityClient {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    // Delete legacy SDK credentials without reading or transmitting their values.
    try {
      for (const name of Object.keys(localStorage)) {
        if (/^sb-.*-auth-token(?:-code-verifier)?$/.test(name))
          localStorage.removeItem(name);
      }
    } catch {
      /* Storage may be disabled. */
    }
    const sync = () => {
      void client.auth
        .getSession()
        .then((result) => {
          if (!result.error) notify(result.data.session);
        })
        .catch(() => {});
    };
    window.addEventListener("focus", sync);
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("community-account");
      channel.onmessage = sync;
    }
  }
  return client;
}
