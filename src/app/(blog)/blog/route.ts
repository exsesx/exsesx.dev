export function GET(request: Request) {
  return Response.redirect(new URL("/blog/en", request.url), 308);
}
