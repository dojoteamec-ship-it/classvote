import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

// Solo las rutas con sesión de mentor; la vista del alumno no la necesita.
export const config = {
  matcher: ["/mentor/:path*", "/admin/:path*"],
};
