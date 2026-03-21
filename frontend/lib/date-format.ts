function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDateDDMMYYYY(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) {
    return "-";
  }

  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}-${month}-${year}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  const day = pad(parsed.getUTCDate());
  const month = pad(parsed.getUTCMonth() + 1);
  const year = parsed.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export function parseFlexibleDateToISO(input: string): string | null {
  const raw = input.trim();
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : raw;
  }

  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    const day = Number(dd);
    const month = Number(mm) - 1;
    const year = Number(yyyy);
    const parsed = new Date(year, month, day);

    if (parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day) {
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    }

    return null;
  }

  const looseParsed = new Date(raw);
  if (Number.isNaN(looseParsed.getTime())) {
    return null;
  }

  return `${looseParsed.getFullYear()}-${pad(looseParsed.getMonth() + 1)}-${pad(looseParsed.getDate())}`;
}