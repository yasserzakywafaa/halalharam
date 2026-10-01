import { handleHealthRequest } from "@/src/lib/server/services/healthService.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleHealthRequest(request);
