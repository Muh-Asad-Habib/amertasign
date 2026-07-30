import { EMAIL_REGEX, PASSWORD_MAX_LENGTH, isValidEmail, isValidUsername } from '../validation';

describe('validasi username', () => {
  it('menerima username yang sesuai aturan', () => {
    expect(isValidUsername('amerta.sign')).toBe(true);
    expect(isValidUsername('user_123')).toBe(true);
    expect(isValidUsername('abc')).toBe(true);
  });

  it('menolak username terlalu pendek, terlalu panjang, atau berkarakter terlarang', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
    expect(isValidUsername('user name')).toBe(false);
    expect(isValidUsername('user@name')).toBe(false);
  });
});

describe('validasi email', () => {
  it('menerima alamat email yang wajar', () => {
    expect(isValidEmail('nama@email.com')).toBe(true);
    expect(isValidEmail('a.b-c@sub.domain.co.id')).toBe(true);
  });

  it('menolak alamat email tanpa domain atau berspasi', () => {
    expect(isValidEmail('nama@email')).toBe(false);
    expect(isValidEmail('nama email@domain.com')).toBe(false);
    expect(isValidEmail('nama.email.com')).toBe(false);
  });

  it('tidak menyimpan state lastIndex antar pemanggilan', () => {
    expect(EMAIL_REGEX.test('a@b.co')).toBe(true);
    expect(EMAIL_REGEX.test('a@b.co')).toBe(true);
  });
});

describe('batas password', () => {
  it('mengikuti batas 72 byte bcrypt', () => {
    expect(PASSWORD_MAX_LENGTH).toBe(72);
  });
});
