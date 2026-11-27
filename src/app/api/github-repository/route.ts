import {
  lookupRepository,
  RepositoryLookupError,
} from "@/lib/server/github-repository";
export async function GET(request: Request) {
  try {
    const data = await lookupRepository(
      new URL(request.url).searchParams.get("repository") ?? "",
    );
    return Response.json(
      { data, error: null },
      {
        headers: {
          "Cache-Control": "public, max-age=600",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    const known = error instanceof RepositoryLookupError;
    return Response.json(
      {
        data: null,
        error: known
          ? error.message
          : "Could not load GitHub details. You can still enter them yourself.",
      },
      {
        status: known ? error.status : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
