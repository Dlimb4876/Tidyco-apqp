import { getBankHolidaysForYear } from '../portals/capacity/shared/js/cap-utils.js'

describe('England bank holiday calculation', () => {
  test('does not include 2026-06-01 as a bank holiday', () => {
    const holidays2026 = getBankHolidaysForYear(2026);
    const dates = holidays2026.map(h => h.date);

    expect(dates).not.toContain('2026-06-01');
    expect(dates).toContain('2026-05-25');
  });

  test('uses New Year substitute date when 1st Jan is weekend', () => {
    const holidays2022 = getBankHolidaysForYear(2022);
    const dates = holidays2022.map(h => h.date);

    expect(dates).toContain('2022-01-03');
    expect(dates).not.toContain('2022-01-01');
  });

  test('handles Christmas and Boxing Day substitutions correctly when Christmas is Sunday', () => {
    const holidays2023 = getBankHolidaysForYear(2023);
    const dates = holidays2023.map(h => h.date);

    expect(dates).toContain('2023-12-25');
    expect(dates).toContain('2023-12-26');
  });

  test('handles Christmas and Boxing Day substitutions correctly when Christmas is Saturday', () => {
    const holidays2021 = getBankHolidaysForYear(2021);
    const dates = holidays2021.map(h => h.date);

    expect(dates).toContain('2021-12-27');
    expect(dates).toContain('2021-12-28');
    expect(dates).not.toContain('2021-12-25');
    expect(dates).not.toContain('2021-12-26');
  });
});
