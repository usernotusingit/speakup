import { prisma } from "./prisma";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
}

async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) return null;

  const isExpired =
    account.expires_at != null &&
    account.expires_at < Math.floor(Date.now() / 1000);

  if (!isExpired) return account.access_token;

  if (!account.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    },
  });

  return data.access_token as string;
}

async function fetchCalendarEvents(
  token: string,
  calendarId: string,
  maxResults = 10
): Promise<CalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("timeMin", new Date().toISOString());
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []) as CalendarEvent[];
}

export async function initSpeakupCalendar(teacherId: string): Promise<string | null> {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (teacher?.speakupCalendarId) return teacher.speakupCalendarId;

  const token = await getAccessToken(teacherId);
  if (!token) return null;

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary: "Speak-Up English" }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const calendarId = data.id as string;

  await prisma.user.update({
    where: { id: teacherId },
    data: { speakupCalendarId: calendarId },
  });

  return calendarId;
}

export async function getTeacherEvents(teacherId: string): Promise<CalendarEvent[]> {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher?.speakupCalendarId) return [];

  const token = await getAccessToken(teacherId);
  if (!token) return [];

  return fetchCalendarEvents(token, teacher.speakupCalendarId, 20);
}

export async function getStudentClassEvents(
  studentEmail: string
): Promise<CalendarEvent[]> {
  const teacher = await prisma.user.findFirst({
    where: { role: "teacher", speakupCalendarId: { not: null } },
  });

  if (!teacher?.speakupCalendarId) return [];

  const token = await getAccessToken(teacher.id);
  if (!token) return [];

  const events = await fetchCalendarEvents(token, teacher.speakupCalendarId, 50);

  return events.filter((e) =>
    e.attendees?.some((a) => a.email === studentEmail)
  );
}

export async function createClassEvent(
  teacherId: string,
  event: {
    summary: string;
    startDateTime: string;
    endDateTime: string;
    attendeeEmails: string[];
  }
): Promise<CalendarEvent | null> {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher?.speakupCalendarId) return null;

  const token = await getAccessToken(teacherId);
  if (!token) return null;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(teacher.speakupCalendarId)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        start: { dateTime: event.startDateTime },
        end: { dateTime: event.endDateTime },
        attendees: event.attendeeEmails.map((email) => ({ email })),
      }),
    }
  );

  if (!res.ok) return null;

  return (await res.json()) as CalendarEvent;
}

export function formatEventTime(event: CalendarEvent): string {
  const start = event.start.dateTime ?? event.start.date;
  if (!start) return "";

  const date = new Date(start);

  if (event.start.date && !event.start.dateTime) {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  return date.toLocaleString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
