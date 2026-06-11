import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initSpeakupCalendar } from "@/lib/googleCalendar";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = req.nextUrl.searchParams.get("role");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (session?.user?.id && (role === "teacher" || role === "student")) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    if (role === "teacher") {
      await initSpeakupCalendar(session.user.id);
    }
  }

  redirect(next);
}
