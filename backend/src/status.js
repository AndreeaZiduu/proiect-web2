const TIMEZONE = 'Europe/Bucharest';

function getBucharestParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = {};
  for (const p of formatter.formatToParts(date)) {
    parts[p.type] = p.value;
  }

  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = parts.hour === '24' ? 0 : parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);

  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: weekdayMap[parts.weekday],
    minuteOfDay: hour * 60 + minute
  };
}

function formatMinutes(totalMin) {
  const normalized = ((totalMin % 1440) + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, '0');
  const m = String(normalized % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function shouldAutoApproveCorrection(correction) {
  if (!correction) return false;
  const threshold = correction.isClosedOverride ? 4 : 8;
  return (correction.confirmations || 0) >= threshold;
}

export function getFacilityStatus(facility, momentInput = new Date()) {
  const moment = momentInput instanceof Date ? momentInput : new Date(momentInput);
  const nowMs = moment.getTime();
  const { dateStr, dayOfWeek, minuteOfDay } = getBucharestParts(moment);

  // 1. Verificăm rotația de gardă (prioritate maximă - deschis non-stop pe intervalul gărzii)
  const activeOnCall = (facility.onCallRotations || []).find((rot) => {
    const start = new Date(rot.startsAt).getTime();
    const end = new Date(rot.endsAt).getTime();
    return nowMs >= start && nowMs < end;
  });

  if (activeOnCall) {
    const minsLeft = Math.round((new Date(activeOnCall.endsAt).getTime() - nowMs) / 60000);
    return {
      isOpen: true,
      code: minsLeft <= 30 ? 'CLOSING_SOON' : 'OPEN',
      label: minsLeft <= 30 ? `De gardă · se închide în ${minsLeft} min` : 'Deschis acum (De gardă)',
      source: 'ON_CALL_ROTATION',
      isOnCall: true
    };
  }

  // 2. Verificăm corecțiile aprobate ale utilizatorilor valabile la acest moment
  const activeCorrection = (facility.corrections || []).find((corr) => {
    if (corr.status !== 'APPROVED') return false;
    const from = new Date(corr.validFrom).getTime();
    const until = new Date(corr.validUntil).getTime();
    return nowMs >= from && nowMs <= until;
  });

  if (activeCorrection) {
    if (activeCorrection.isClosedOverride) {
      return {
        isOpen: false,
        code: 'CLOSED',
        label: `Închis temporar (${activeCorrection.proposedNote})`,
        source: 'APPROVED_CORRECTION',
        isOnCall: false
      };
    }

    if (
      typeof activeCorrection.proposedOpenMin === 'number' &&
      typeof activeCorrection.proposedCloseMin === 'number'
    ) {
      const openM = activeCorrection.proposedOpenMin;
      const closeM = activeCorrection.proposedCloseMin;
      const isWithin =
        closeM > openM
          ? minuteOfDay >= openM && minuteOfDay < closeM
          : minuteOfDay >= openM || minuteOfDay < closeM;

      if (isWithin) {
        const minsLeft =
          closeM > openM
            ? closeM - minuteOfDay
            : minuteOfDay >= openM
              ? 1440 - minuteOfDay + closeM
              : closeM - minuteOfDay;

        return {
          isOpen: true,
          code: minsLeft <= 30 ? 'CLOSING_SOON' : 'OPEN',
          label:
            minsLeft <= 30
              ? `Se închide în ${minsLeft} min (program actualizat)`
              : `Deschis până la ${formatMinutes(closeM)} (actualizat)`,
          source: 'APPROVED_CORRECTION',
          isOnCall: false
        };
      }

      return {
        isOpen: false,
        code: 'CLOSED',
        label: minuteOfDay < openM ? `Se deschide la ${formatMinutes(openM)}` : 'Închis acum',
        source: 'APPROVED_CORRECTION',
        isOnCall: false
      };
    }
  }

  // 3. Verificăm excepțiile de sărbători legale
  const holiday = (facility.holidaySchedules || []).find((h) => {
    const hDateStr =
      typeof h.date === 'string'
        ? h.date.slice(0, 10)
        : getBucharestParts(new Date(h.date)).dateStr;
    return hDateStr === dateStr;
  });

  if (holiday) {
    if (holiday.isClosed) {
      return {
        isOpen: false,
        code: 'CLOSED',
        label: `Închis (${holiday.holidayName})`,
        source: 'HOLIDAY_SCHEDULE',
        isOnCall: false
      };
    }

    if (typeof holiday.openMinute === 'number' && typeof holiday.closeMinute === 'number') {
      if (minuteOfDay >= holiday.openMinute && minuteOfDay < holiday.closeMinute) {
        const minsLeft = holiday.closeMinute - minuteOfDay;
        return {
          isOpen: true,
          code: minsLeft <= 30 ? 'CLOSING_SOON' : 'OPEN',
          label:
            minsLeft <= 30
              ? `Se închide în ${minsLeft} min (${holiday.holidayName})`
              : `Deschis până la ${formatMinutes(holiday.closeMinute)} (${holiday.holidayName})`,
          source: 'HOLIDAY_SCHEDULE',
          isOnCall: false
        };
      }
      return {
        isOpen: false,
        code: 'CLOSED',
        label:
          minuteOfDay < holiday.openMinute
            ? `Se deschide la ${formatMinutes(holiday.openMinute)} (${holiday.holidayName})`
            : `Închis (${holiday.holidayName})`,
        source: 'HOLIDAY_SCHEDULE',
        isOnCall: false
      };
    }
  }

  // 4. Evaluăm programul normal (inclusiv intervale multiple și ture peste miezul nopții)
  const schedules = facility.regularSchedules || [];
  const prevDayOfWeek = (dayOfWeek + 6) % 7;

  // Verificăm dacă o tură începută ieri peste miezul nopții este încă activă acum
  const overnightFromYesterday = schedules.find(
    (s) => s.dayOfWeek === prevDayOfWeek && s.crossesMidnight && minuteOfDay < s.closeMinute
  );

  if (overnightFromYesterday) {
    const minsLeft = overnightFromYesterday.closeMinute - minuteOfDay;
    return {
      isOpen: true,
      code: minsLeft <= 30 ? 'CLOSING_SOON' : 'OPEN',
      label:
        minsLeft <= 30
          ? `Se închide în ${minsLeft} min`
          : `Deschis până la ${formatMinutes(overnightFromYesterday.closeMinute)}`,
      source: 'REGULAR_SCHEDULE',
      isOnCall: false
    };
  }

  // Verificăm intervalele de azi
  const todaySchedules = schedules
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.openMinute - b.openMinute);

  for (const s of todaySchedules) {
    if (s.crossesMidnight) {
      if (minuteOfDay >= s.openMinute) {
        const minsLeft = 1440 - minuteOfDay + s.closeMinute;
        return {
          isOpen: true,
          code: minsLeft <= 30 ? 'CLOSING_SOON' : 'OPEN',
          label:
            minsLeft <= 30
              ? `Se închide în ${minsLeft} min`
              : `Deschis până la ${formatMinutes(s.closeMinute)}`,
          source: 'REGULAR_SCHEDULE',
          isOnCall: false
        };
      }
    } else if (minuteOfDay >= s.openMinute && minuteOfDay < s.closeMinute) {
      const minsLeft = s.closeMinute - minuteOfDay;
      if (s.openMinute === 0 && s.closeMinute === 1440) {
        return {
          isOpen: true,
          code: 'OPEN',
          label: 'Deschis Non-Stop',
          source: 'REGULAR_SCHEDULE',
          isOnCall: false
        };
      }
      return {
        isOpen: true,
        code: minsLeft <= 30 ? 'CLOSING_SOON' : 'OPEN',
        label:
          minsLeft <= 30
            ? `Se închide în ${minsLeft} min`
            : `Deschis până la ${formatMinutes(s.closeMinute)}`,
        source: 'REGULAR_SCHEDULE',
        isOnCall: false
      };
    }
  }

  // Dacă e închis acum, căutăm următorul interval de deschidere de azi
  const nextToday = todaySchedules.find((s) => s.openMinute > minuteOfDay);
  if (nextToday) {
    return {
      isOpen: false,
      code: 'CLOSED',
      label: `Se deschide la ${formatMinutes(nextToday.openMinute)}`,
      source: 'REGULAR_SCHEDULE',
      isOnCall: false
    };
  }

  return {
    isOpen: false,
    code: 'CLOSED',
    label: 'Închis acum',
    source: 'REGULAR_SCHEDULE',
    isOnCall: false
  };
}
