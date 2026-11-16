import { describe, it, expect } from 'vitest';
import { getFacilityStatus } from '../src/status.js';

const basePharmacy = {
  id: 'fac-1',
  name: 'Farmacia Test Sibiu',
  regularSchedules: [
    // Luni (1): 08:00-13:00 și 14:00-20:00 (cu pauză de prânz)
    { dayOfWeek: 1, openMinute: 8 * 60, closeMinute: 13 * 60, crossesMidnight: false },
    { dayOfWeek: 1, openMinute: 14 * 60, closeMinute: 20 * 60, crossesMidnight: false },
    // Vineri (5): tură de noapte 22:00-06:00
    { dayOfWeek: 5, openMinute: 22 * 60, closeMinute: 6 * 60, crossesMidnight: true }
  ],
  holidaySchedules: [],
  onCallRotations: [],
  corrections: []
};

describe('getFacilityStatus - 5 surse de adevăr (Europe/Bucharest)', () => {
  it('1. Deschis în program normal dimineața', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-16T10:00:00+02:00')); // Luni
    expect(res.isOpen).toBe(true);
    expect(res.code).toBe('OPEN');
    expect(res.source).toBe('REGULAR_SCHEDULE');
  });

  it('2. Închis în pauza de prânz și afișează ora redeschiderii', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-16T13:30:00+02:00'));
    expect(res.isOpen).toBe(false);
    expect(res.label).toBe('Se deschide la 14:00');
  });

  it('3. Se închide în mai puțin de 30 de minute (CLOSING_SOON)', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-16T19:40:00+02:00'));
    expect(res.isOpen).toBe(true);
    expect(res.code).toBe('CLOSING_SOON');
    expect(res.label).toContain('20 min');
  });

  it('4. Închis după terminarea programului de seară', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-16T21:00:00+02:00'));
    expect(res.isOpen).toBe(false);
    expect(res.label).toBe('Închis acum');
  });

  it('5. Închis dimineața devreme înainte de deschidere', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-16T07:15:00+02:00'));
    expect(res.isOpen).toBe(false);
    expect(res.label).toBe('Se deschide la 08:00');
  });

  it('6. Deschis în tură peste miezul nopții (înainte de 00:00)', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-20T23:30:00+02:00')); // Vineri 23:30
    expect(res.isOpen).toBe(true);
    expect(res.label).toBe('Deschis până la 06:00');
  });

  it('7. Deschis în tură peste miezul nopții (după 00:00, sâmbătă dimineața)', () => {
    const res = getFacilityStatus(basePharmacy, new Date('2026-11-21T03:15:00+02:00')); // Sâmbătă 03:15
    expect(res.isOpen).toBe(true);
    expect(res.source).toBe('REGULAR_SCHEDULE');
  });

  it('8. Excepție de sărbătoare legală - închis toată ziua', () => {
    const fac = {
      ...basePharmacy,
      holidaySchedules: [{ date: '2026-12-25', holidayName: 'Crăciun', isClosed: true }]
    };
    const res = getFacilityStatus(fac, new Date('2026-12-25T10:30:00+02:00'));
    expect(res.isOpen).toBe(false);
    expect(res.source).toBe('HOLIDAY_SCHEDULE');
    expect(res.label).toContain('Crăciun');
  });

  it('9. Excepție de sărbătoare legală - program redus (deschis în interval)', () => {
    const fac = {
      ...basePharmacy,
      holidaySchedules: [
        { date: '2026-12-24', holidayName: 'Ajun Crăciun', isClosed: false, openMinute: 9 * 60, closeMinute: 14 * 60 }
      ]
    };
    const res = getFacilityStatus(fac, new Date('2026-12-24T11:00:00+02:00'));
    expect(res.isOpen).toBe(true);
    expect(res.source).toBe('HOLIDAY_SCHEDULE');
  });

  it('10. Rotație de gardă în noaptea de Revelion suprascrie sărbătoarea și programul normal', () => {
    const fac = {
      ...basePharmacy,
      holidaySchedules: [{ date: '2027-01-01', holidayName: 'Anul Nou', isClosed: true }],
      onCallRotations: [
        {
          startsAt: '2026-12-31T20:00:00+02:00',
          endsAt: '2027-01-01T08:00:00+02:00'
        }
      ]
    };
    const res = getFacilityStatus(fac, new Date('2027-01-01T02:30:00+02:00'));
    expect(res.isOpen).toBe(true);
    expect(res.isOnCall).toBe(true);
    expect(res.source).toBe('ON_CALL_ROTATION');
  });

  it('11. Corecție aprobată de utilizator suprascrie programul normal', () => {
    const fac = {
      ...basePharmacy,
      corrections: [
        {
          status: 'APPROVED',
          proposedNote: 'Program prelungit azi',
          proposedOpenMin: 8 * 60,
          proposedCloseMin: 22 * 60,
          isClosedOverride: false,
          validFrom: '2026-11-16T00:00:00+02:00',
          validUntil: '2026-11-16T23:59:59+02:00'
        }
      ]
    };
    const res = getFacilityStatus(fac, new Date('2026-11-16T21:00:00+02:00'));
    expect(res.isOpen).toBe(true);
    expect(res.source).toBe('APPROVED_CORRECTION');
  });

  it('12. Corecție aprobată pentru închidere temporară (inventar / pană curent)', () => {
    const fac = {
      ...basePharmacy,
      corrections: [
        {
          status: 'APPROVED',
          proposedNote: 'Închis pentru inventar',
          isClosedOverride: true,
          validFrom: '2026-11-16T08:00:00+02:00',
          validUntil: '2026-11-16T18:00:00+02:00'
        }
      ]
    };
    const res = getFacilityStatus(fac, new Date('2026-11-16T10:30:00+02:00'));
    expect(res.isOpen).toBe(false);
    expect(res.source).toBe('APPROVED_CORRECTION');
    expect(res.label).toContain('inventar');
  });

  it('13. Corecție expirată este ignorată', () => {
    const fac = {
      ...basePharmacy,
      corrections: [
        {
          status: 'APPROVED',
          proposedNote: 'Corecție veche',
          isClosedOverride: true,
          validFrom: '2026-11-10T08:00:00+02:00',
          validUntil: '2026-11-10T18:00:00+02:00'
        }
      ]
    };
    const res = getFacilityStatus(fac, new Date('2026-11-16T10:30:00+02:00'));
    expect(res.isOpen).toBe(true);
    expect(res.source).toBe('REGULAR_SCHEDULE');
  });

  it('14. Corecție PENDING (neaprobată încă) nu afectează starea publică', () => {
    const fac = {
      ...basePharmacy,
      corrections: [
        {
          status: 'PENDING',
          proposedNote: 'Neconfirmat',
          isClosedOverride: true,
          validFrom: '2026-11-16T00:00:00+02:00',
          validUntil: '2026-11-16T23:59:59+02:00'
        }
      ]
    };
    const res = getFacilityStatus(fac, new Date('2026-11-16T10:30:00+02:00'));
    expect(res.isOpen).toBe(true);
  });

  it('15. Unitate Non-Stop (00:00 - 24:00)', () => {
    const nonstop = {
      ...basePharmacy,
      regularSchedules: [{ dayOfWeek: 0, openMinute: 0, closeMinute: 1440, crossesMidnight: false }]
    };
    const res = getFacilityStatus(nonstop, new Date('2026-11-15T04:00:00+02:00')); // Duminică
    expect(res.isOpen).toBe(true);
    expect(res.label).toBe('Deschis Non-Stop');
  });

  it('16. Schimbarea orei în Europe/Bucharest (trecerea la ora de vară în ultima duminică din martie)', () => {
    const dstFacility = {
      ...basePharmacy,
      regularSchedules: [{ dayOfWeek: 0, openMinute: 0, closeMinute: 1440, crossesMidnight: false }]
    };
    // 29 martie 2026 ora 03:30 EEST (+03:00)
    const res = getFacilityStatus(dstFacility, new Date('2026-03-29T03:30:00+03:00'));
    expect(res.isOpen).toBe(true);
    expect(res.source).toBe('REGULAR_SCHEDULE');
  });
});
