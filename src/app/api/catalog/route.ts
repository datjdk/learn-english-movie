import { getCatalogPage } from "@/lib/catalogPage";

// Next pages of the home catalog for infinite scroll; page 1 is rendered
// with the home page itself.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  return Response.json(await getCatalogPage(query, page));
}
