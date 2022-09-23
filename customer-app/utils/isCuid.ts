const CODES = {
  a: 97,
  zero: 48,
};

// numerical char codes range from 48 -> 48 + 9
const NUMBERS_CHAR_CODES = Array(10)
  .fill(null)
  .map((_, idx) => idx + CODES.zero);

// lowercase alphabet codes
const LOWERCASE_LETTERS_CHAR_CODES = Array(26)
  .fill(null)
  .map((_, idx) => idx + CODES.a);

const VALID_CUID_CHAR_CODES = [
  ...NUMBERS_CHAR_CODES,
  ...LOWERCASE_LETTERS_CHAR_CODES,
];

const containsOnlyValidCuidValues = (val: string): boolean => {
  // remove 'c' char
  const tail = val.substr(1);

  return tail
    .split('')
    .every((char) => VALID_CUID_CHAR_CODES.includes(char.charCodeAt(0)));
};

// https://github.com/ericelliott/cuid/issues/88#issuecomment-339848922
export const isCuid = (val: unknown): val is string =>
  typeof val === 'string' &&
  val.charAt(0) === 'c' &&
  val.length > 7 &&
  containsOnlyValidCuidValues(val);
