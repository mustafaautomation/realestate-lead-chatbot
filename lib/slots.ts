export type Slot = {
  id: string;
  startsAt: string;
  label: string;
  weekday: string;
  hour: number;
  minute: number;
};

const WEEKEND = new Set(["Saturday", "Sunday"]);
const WEEKDAY = new Set(["Tuesday", "Wednesday", "Thursday", "Friday"]);

const TEMPLATES: { days: Set<string>; times: [number, number][] }[] = [
  { days: WEEKEND, times: [[10, 0], [11, 0], [13, 0]] },
  { days: WEEKDAY, times: [[16, 0], [17, 30]] },
];

export function buildSlots(now: Date, limit = 8): Slot[] {
  const slots: Slot[] = [];
  const cursor = new Date(now.getTime());
  cursor.setMinutes(0, 0, 0);
  const end = now.getTime() + 16 * 24 * 60 * 60 * 1000;
  while (cursor.getTime() < end && slots.length < limit) {
    const parts = denverParts(cursor);
    const template = TEMPLATES.find((item) => item.days.has(parts.weekday) && item.times.some(([hour, minute]) => hour === parts.hour && minute === parts.minute));
    if (template && cursor.getTime() > now.getTime() + 2 * 60 * 60 * 1000) {
      slots.push({
        id: cursor.toISOString(),
        startsAt: cursor.toISOString(),
        label: `${parts.weekday.slice(0, 3)} ${parts.month} ${parts.day} · ${formatClock(parts.hour, parts.minute)} MT`,
        weekday: parts.weekday,
        hour: parts.hour,
        minute: parts.minute,
      });
    }
    cursor.setMinutes(cursor.getMinutes() + 30);
  }
  return slots;
}

export function matchSlot(message: string, slots: Slot[]): Slot | undefined {
  const lower = message.toLowerCase();
  const day = matchDay(lower);
  const time = matchClock(lower);
  return slots.find((slot) => {
    const dayOk = !day || slot.weekday.toLowerCase().startsWith(day);
    const timeOk = !time || (slot.hour === time.hour && slot.minute === time.minute);
    return dayOk && timeOk && (day || time);
  });
}

function matchDay(lower: string): string | undefined {
  const long = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const found = long.find((day) => lower.includes(day));
  if (found) return found;
  const short = lower.match(/\b(sun|mon|tue|wed|thu|fri|sat)\b/);
  if (!short) return undefined;
  return long.find((day) => day.startsWith(short[1]));
}

function matchClock(lower: string): { hour: number; minute: number } | undefined {
  const ampm = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2] ?? "0");
    const mark = ampm[3];
    if (mark === "pm" && hour < 12) hour += 12;
    if (mark === "am" && hour === 12) hour = 0;
    return { hour, minute };
  }
  const plain = lower.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!plain) return undefined;
  return { hour: Number(plain[1]), minute: Number(plain[2]) };
}

function denverParts(date: Date): { weekday: string; month: string; day: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    month: get("month"),
    day: get("day"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function formatClock(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${suffix}`;
}
