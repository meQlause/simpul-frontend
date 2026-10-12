// How a work item's state is written in a row: the mockup's wording, from the API's data.
import type { WorkItem } from './work.schema';

const SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTE = SECOND * SECONDS_PER_MINUTE;
const HOUR = MINUTE * MINUTES_PER_HOUR;
const DAY = HOUR * HOURS_PER_DAY;
const ARCHIVE_DAYS = 14;
const WORKSPACE_ZONE = 'Asia/Jakarta';

type Status = WorkItem['status'];

const COLORS: Record<Status, string> = {
  stalled: 'amber',
  active: 'blue',
  completed: 'green',
  tentative: 'gray',
  cancelled: 'gray',
  archived: 'gray',
};

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`;

function ago(age: number) {
  return age < HOUR
    ? `${plural(Math.round(age / MINUTE), 'minute')} ago`
    : `${plural(Math.round(age / HOUR), 'hour')} ago`;
}

function closed(age: number) {
  if (age < DAY) {
    return 'Closed today';
  }

  return age < 2 * DAY ? 'Closed yesterday' : `Closed ${plural(Math.floor(age / DAY), 'day')} ago`;
}

export function statusColor(status: Status) {
  return COLORS[status];
}

export function elapsed(instant: string, status: Status) {
  const age = Math.max(0, Date.now() - Date.parse(instant));

  switch (status) {
    case 'stalled':
      return `No update for ${plural(Math.round(age / HOUR), 'hour')}`;
    case 'tentative':
      return `First signal · ${ago(age)}`;
    case 'cancelled':
      return closed(age);
    case 'archived':
      return `Archived after ${ARCHIVE_DAYS} days`;
    default:
      return ago(age);
  }
}

const clock = (instant: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WORKSPACE_ZONE,
  })
    .format(instant)
    .replace(':', '.');

const calendarDay = (instant: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: WORKSPACE_ZONE }).format(instant);

// "Today, 10.49" · "Yesterday, 16.02" · "Oct 8, 16.02" — when something happened, in the workspace's clock.
export function dayTime(iso: string, now: Date = new Date()) {
  const happened = new Date(iso);
  const days = Math.round((Date.parse(calendarDay(now)) - Date.parse(calendarDay(happened))) / DAY);

  if (days === 0) {
    return `Today, ${clock(happened)}`;
  }

  if (days === 1) {
    return `Yesterday, ${clock(happened)}`;
  }

  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: WORKSPACE_ZONE,
  }).format(happened);

  return `${date}, ${clock(happened)}`;
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

const TONES: Record<string, string> = { BS: 'sand', RA: 'lavender' };

export function avatarTone(initials: string) {
  return TONES[initials] ?? 'mint';
}
