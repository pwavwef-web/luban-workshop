'use strict';

const BUSINESS_HOURS = Object.freeze({
  timeZone: 'Africa/Accra',
  openDays: Object.freeze([1, 2, 3, 4, 5]),
  openMinutes: 11 * 60,
  closeMinutes: 17 * 60 + 30,
  label: 'Mon-Fri 11:00-17:30'
});

const WEEKDAY_INDEX = Object.freeze({
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
});

function toDate(value) {
  const date = value instanceof Date
    ? value
    : new Date(value === undefined || value === null ? Date.now() : value);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function getAccraParts(value) {
  const date = toDate(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_HOURS.timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).reduce((map, part) => {
    map[part.type] = part.value;
    return map;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
    weekdayIndex: WEEKDAY_INDEX[parts.weekday],
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  };
}

function getLocalOpenDate(parts, dayOffset) {
  return new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day + dayOffset,
    Math.floor(BUSINESS_HOURS.openMinutes / 60),
    BUSINESS_HOURS.openMinutes % 60,
    0,
    0
  ));
}

function getNextServiceOpening(value) {
  const date = toDate(value);
  const parts = getAccraParts(date);
  const currentMinutes = parts.hour * 60 + parts.minute;

  for (let dayOffset = 0; dayOffset <= 8; dayOffset += 1) {
    const candidate = getLocalOpenDate(parts, dayOffset);
    const candidateParts = getAccraParts(candidate);
    const isOpenDay = BUSINESS_HOURS.openDays.includes(candidateParts.weekdayIndex);
    if (!isOpenDay) continue;
    if (dayOffset === 0 && currentMinutes >= BUSINESS_HOURS.closeMinutes) continue;
    return candidate;
  }

  return getLocalOpenDate(parts, 1);
}

function getBusinessHoursState(value) {
  const date = toDate(value);
  const parts = getAccraParts(date);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const isOpenDay = BUSINESS_HOURS.openDays.includes(parts.weekdayIndex);
  const isOpen = isOpenDay &&
    currentMinutes >= BUSINESS_HOURS.openMinutes &&
    currentMinutes < BUSINESS_HOURS.closeMinutes;

  return {
    isOpen,
    evaluatedAt: date,
    nextOpening: isOpen ? null : getNextServiceOpening(date),
    timeZone: BUSINESS_HOURS.timeZone,
    label: BUSINESS_HOURS.label,
    opens: '11:00',
    closes: '17:30'
  };
}

function formatBusinessHoursDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GH', {
    timeZone: BUSINESS_HOURS.timeZone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(toDate(value));
}

function buildBusinessHoursSnapshot(state) {
  const currentState = state || getBusinessHoursState();
  return {
    timeZone: BUSINESS_HOURS.timeZone,
    openDays: 'Mon-Fri',
    opens: currentState.opens,
    closes: currentState.closes,
    label: BUSINESS_HOURS.label,
    evaluatedAt: currentState.evaluatedAt.toISOString(),
    nextServiceAt: currentState.nextOpening ? currentState.nextOpening.toISOString() : ''
  };
}

module.exports = {
  BUSINESS_HOURS,
  buildBusinessHoursSnapshot,
  formatBusinessHoursDateTime,
  getBusinessHoursState,
  getNextServiceOpening
};
