import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX_LEN = 20000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookId = Number(req.nextUrl.searchParams.get("bookId"));
  const lessonId = Number(req.nextUrl.searchParams.get("lessonId"));
  if (!Number.isInteger(bookId) || !Number.isInteger(lessonId)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const note = await prisma.lessonNote.findUnique({
    where: {
      userId_bookId_lessonId: { userId: session.user.id, bookId, lessonId },
    },
  });

  return NextResponse.json({
    content: note?.content ?? "",
    updatedAt: note?.updatedAt ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const bookId = Number(body?.bookId);
  const lessonId = Number(body?.lessonId);
  const content = String(body?.content ?? "");

  if (!Number.isInteger(bookId) || !Number.isInteger(lessonId)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  if (content.length > MAX_LEN) {
    return NextResponse.json({ error: "Note too long" }, { status: 413 });
  }

  const note = await prisma.lessonNote.upsert({
    where: {
      userId_bookId_lessonId: { userId: session.user.id, bookId, lessonId },
    },
    update: { content },
    create: { userId: session.user.id, bookId, lessonId, content },
  });

  return NextResponse.json({ content: note.content, updatedAt: note.updatedAt });
}
