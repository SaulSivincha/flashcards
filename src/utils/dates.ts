export function nowIso(): string {
  return new Date().toISOString();
}

export function formatRelativeStudyDate(value?: string): string {
  if (!value) {
    return "Sin estudiar";
  }

  const date = new Date(value);
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (dayDifference === 0) {
    return "Estudiado hoy";
  }

  if (dayDifference === 1) {
    return "Ayer";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
  }).format(date);
}
