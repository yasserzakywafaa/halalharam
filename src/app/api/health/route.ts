import { handleHealthRequest } from "@/lib/health.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleHealthRequest(request);
