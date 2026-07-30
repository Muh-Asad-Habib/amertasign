import { classifySignLabel } from '../translation';

describe('classifySignLabel', () => {
  it('mengenali huruf tunggal sebagai huruf', () => {
    expect(classifySignLabel('A')).toBe('huruf');
    expect(classifySignLabel('z')).toBe('huruf');
    expect(classifySignLabel(' B ')).toBe('huruf');
  });

  it('mengenali angka', () => {
    expect(classifySignLabel('7')).toBe('angka');
    expect(classifySignLabel('12')).toBe('angka');
  });

  it('menganggap sisanya sebagai kata', () => {
    expect(classifySignLabel('halo')).toBe('kata');
    expect(classifySignLabel('terima kasih')).toBe('kata');
    expect(classifySignLabel('A1')).toBe('kata');
    expect(classifySignLabel('')).toBe('kata');
  });
});
