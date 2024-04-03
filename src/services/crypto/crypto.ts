import * as argon2 from 'argon2';

export class CryptoUtils {
  static getArgonHash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  static compareArgonHash(
    plainPassword: string,
    hashPassword: string,
  ): Promise<boolean> {
    return argon2.verify(hashPassword, plainPassword);
  }
}
