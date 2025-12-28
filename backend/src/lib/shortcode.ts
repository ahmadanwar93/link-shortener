import { customAlphabet } from "nanoid";

// we remove ambigious character 0O, 1lI
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

const generate = customAlphabet(ALPHABET, CODE_LENGTH);

export function generateShortCode(): string {
  return generate();
}

// this will be used for custom code generation
export const SHORT_CODE_MIN_LENGTH = 3;
export const SHORT_CODE_MAX_LENGTH = 30;
