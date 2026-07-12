import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export function POST(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/sign-up/email")) {
    return Response.json({ message: "Public registration is disabled" }, { status: 404 });
  }
  return handler.POST(request);
}
