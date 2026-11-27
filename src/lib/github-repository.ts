export type RepositorySuggestions = {
  title: string;
  description: string;
  tags: string[];
  website: string | null;
};

/** HTTPS public DNS names only. No credentials, IP literals, local hosts or custom ports. */
export function publicWebsite(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example|home|lan|onion)$/.test(
        host,
      )
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export function repositorySuggestions(value: unknown): RepositorySuggestions {
  if (!value || typeof value !== "object")
    throw new Error("Invalid repository response");
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || data.private !== false)
    throw new Error("Public repository required");
  const topics = Array.isArray(data.topics) ? data.topics : [];
  const tags = [...topics, data.language]
    .filter((item): item is string => typeof item === "string")
    .map((item) =>
      item
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32),
    )
    .filter((item) => /^[a-z0-9][a-z0-9-]{0,31}$/.test(item));
  return {
    title: data.name.replace(/[-_]+/g, " ").trim().slice(0, 80),
    description:
      typeof data.description === "string"
        ? data.description.trim().slice(0, 600)
        : "",
    tags: [...new Set(tags)].slice(0, 5),
    website: publicWebsite(data.homepage),
  };
}
