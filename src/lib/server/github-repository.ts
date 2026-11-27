import { githubRepositoryUrl } from "../community";
import { repositorySuggestions } from "../github-repository";

export class RepositoryLookupError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** The only outbound destination is GitHub's public metadata API. Never fetch the homepage. */
export async function lookupRepository(
  value: string,
  fetcher: typeof fetch = fetch,
) {
  const repository = githubRepositoryUrl(value);
  if (!repository)
    throw new RepositoryLookupError(
      400,
      "Enter a GitHub repository URL to get suggestions.",
    );
  const path = new URL(repository).pathname;
  const response = await fetcher(`https://api.github.com/repos${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "UI-Lexicon",
    },
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 600 },
  });
  if (!response.ok) {
    if (response.status === 404)
      throw new RepositoryLookupError(
        404,
        "Repository not found or private. Check the link, or enter the details yourself.",
      );
    if (response.status === 403 || response.status === 429)
      throw new RepositoryLookupError(
        429,
        "GitHub is limiting requests. Try again later, or enter the details yourself.",
      );
    throw new RepositoryLookupError(
      502,
      "GitHub is unavailable. You can still enter the project details yourself.",
    );
  }
  return repositorySuggestions(await response.json());
}
