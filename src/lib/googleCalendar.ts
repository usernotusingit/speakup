import { prisma } from "./prisma";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
}

// Result wrapper so callers can distinguish a genuine empty calendar from an
// error condition (missing token, missing calendar, insufficient scope, API
// failure). Previously every failure collapsed into an empty list.
export type CalendarResult =
  | { status: "ok"; events: CalendarEvent[] }
  | { status: "no_calendar" } // teacher has no calendar and we couldn't create one
  | { status: "scope_missing" } // account never granted the calendar scope
  | { status: "error" }; // token/refresh/API failure

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

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

  if (!res.ok) {
    console.error(
      `getAccessToken: token refresh failed for user ${userId} (${res.status})`
    );
    return null;
  }

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

// Cheap check (no Google API call) for whether the user's Google account ever
// granted the Calendar scope. Used to detect teachers who signed in before the
// scope was requested.
async function hasCalendarScope(userId: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  return account?.scope?.includes(CALENDAR_SCOPE) ?? false;
}

// Returns null when the fetch fails (so callers can surface an error), an array
// (possibly empty) when it succeeds.
async function fetchCalendarEvents(
  token: string,
  calendarId: string,
  maxResults = 10
): Promise<CalendarEvent[] | null> {
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

  if (!res.ok) {
    console.error(
      `fetchCalendarEvents: ${res.status} for calendar ${calendarId}`
    );
    return null;
  }

  const data = await res.json();
  return (data.items ?? []) as CalendarEvent[];
}

export async function initSpeakupCalendar(teacherId: string): Promise<string | null> {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (teacher?.speakupCalendarId) return teacher.speakupCalendarId;

  const token = await getAccessToken(teacherId);
  if (!token) {
    console.error(`initSpeakupCalendar: no access token for teacher ${teacherId}`);
    return null;
  }

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary: "Speak-Up English" }),
  });

  if (!res.ok) {
    console.error(
      `initSpeakupCalendar: create failed for teacher ${teacherId} (${res.status})`
    );
    return null;
  }

  const data = await res.json();
  const calendarId = data.id as string;

  await prisma.user.update({
    where: { id: teacherId },
    data: { speakupCalendarId: calendarId },
  });

  return calendarId;
}

// Resolve (and lazily create) the teacher's calendar id. Returns the id, or a
// CalendarResult describing why it couldn't be obtained.
async function resolveTeacherCalendarId(
  teacherId: string
): Promise<{ calendarId: string } | { result: CalendarResult }> {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (teacher?.speakupCalendarId) return { calendarId: teacher.speakupCalendarId };

  // No calendar yet — only worth creating if the scope was granted.
  if (!(await hasCalendarScope(teacherId))) {
    return { result: { status: "scope_missing" } };
  }

  const calendarId = await initSpeakupCalendar(teacherId);
  if (!calendarId) return { result: { status: "error" } };
  return { calendarId };
}

export async function getTeacherEvents(teacherId: string): Promise<CalendarResult> {
  const resolved = await resolveTeacherCalendarId(teacherId);
  if ("result" in resolved) return resolved.result;

  const token = await getAccessToken(teacherId);
  if (!token) {
    console.error(`getTeacherEvents: no access token for teacher ${teacherId}`);
    return { status: "error" };
  }

  const events = await fetchCalendarEvents(token, resolved.calendarId, 20);
  if (events === null) return { status: "error" };
  return { status: "ok", events };
}

export async function getStudentClassEvents(
  studentEmail: string
): Promise<CalendarResult> {
  const email = studentEmail.toLowerCase();

  // Read the calendars of exactly the teachers this student is enrolled with.
  const enrollments = await prisma.enrollment.findMany({
    where: { studentEmail: email },
    include: { teacher: true },
  });

  if (enrollments.length === 0) return { status: "ok", events: [] };

  const merged = new Map<string, CalendarEvent>();
  let anyError = false;

  for (const { teacher } of enrollments) {
    if (!teacher.speakupCalendarId) continue;

    const token = await getAccessToken(teacher.id);
    if (!token) {
      console.error(
        `getStudentClassEvents: no access token for teacher ${teacher.id}`
      );
      anyError = true;
      continue;
    }

    const events = await fetchCalendarEvents(token, teacher.speakupCalendarId, 50);
    if (events === null) {
      anyError = true;
      continue;
    }

    for (const event of events) {
      if (event.attendees?.some((a) => a.email?.toLowerCase() === email)) {
        merged.set(event.id, event); // dedupe by event id across calendars
      }
    }
  }

  // Only report an error if we got nothing *and* a fetch actually failed —
  // otherwise an enrolled-but-no-events student correctly sees an empty list.
  if (merged.size === 0 && anyError) return { status: "error" };

  const events = [...merged.values()].sort((a, b) => {
    const sa = a.start.dateTime ?? a.start.date ?? "";
    const sb = b.start.dateTime ?? b.start.date ?? "";
    return sa.localeCompare(sb);
  });

  return { status: "ok", events };
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
  const resolved = await resolveTeacherCalendarId(teacherId);
  if ("result" in resolved) {
    console.error(
      `createClassEvent: cannot resolve calendar for teacher ${teacherId} (${resolved.result.status})`
    );
    return null;
  }

  const token = await getAccessToken(teacherId);
  if (!token) {
    console.error(`createClassEvent: no access token for teacher ${teacherId}`);
    return null;
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(resolved.calendarId)}/events?sendUpdates=all`,
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

  if (!res.ok) {
    console.error(
      `createClassEvent: create failed for teacher ${teacherId} (${res.status})`
    );
    return null;
  }

  return (await res.json()) as CalendarEvent;
}

export function formatEventTime(event: CalendarEvent): string {
  const start = event.start.dateTime ?? event.start.date;
  if (!start) return "";

  const date = new Date(start);

  if (event.start.date && !event.start.dateTime) {
    // All-day events are a bare "YYYY-MM-DD" (UTC midnight); format in UTC so
    // the calendar day isn't shifted back by the -03:00 offset.
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }

  // Server runs in UTC; pin to Brazil time so timed classes display in the
  // school's local zone instead of UTC.
  return date.toLocaleString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
