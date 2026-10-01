import { handleHealthRequest } from "@/lib/health.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleHealthRequest(request);
