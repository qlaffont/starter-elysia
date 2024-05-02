import { db } from '@db/connection';
import { Tokens, Users } from '@db/schemas';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import {
  createUserToken,
  getAccessTokenFromRequest,
  refreshUserToken,
  removeUserToken,
} from 'elysia-auth-drizzle';
import timestring from 'timestring';
import { BadRequest } from 'unify-errors';

import { CryptoUtils } from '../../services/crypto/crypto';
import {
  validateEmail,
  validatePassword,
} from '../../services/validation/validateString';
import type { ElysiaCookie, ElysiaRequest } from '../../types/module';
import { AuthErrors, type User, type UserRegister } from './authType';

export const waitRandom = (): Promise<void> => {
  const min = 1000;
  const max = 5000;
  const delay = Math.random() * (max - min) + min;

  return new Promise((resolve) => setTimeout(resolve, delay));
};

class AuthController {
  static async loginAndGenerateToken(user: User, cookie: ElysiaCookie) {
    const { accessToken, refreshToken } = await createUserToken({
      db: db,
      usersSchema: Users,
      tokensSchema: Tokens,
    })(user.id, {
      secret: env.JWT_ACCESS_SECRET!,
      refreshSecret: env.JWT_REFRESH_SECRET!,
      accessTokenTime: env.JWT_ACCESS_TIME!,
      refreshTokenTime: env.JWT_REFRESH_TIME!,
    });

    cookie.refresh.set({
      value: refreshToken,
      maxAge: timestring(env.JWT_REFRESH_TIME!),
    });

    return { access_token: accessToken };
  }

  static async registerUser(registerUser: UserRegister) {
    const existingUser = await db.query.Users.findFirst({
      where: eq(Users.email, registerUser.email),
    });

    if (existingUser) {
      await waitRandom();
      throw new BadRequest({ error: AuthErrors.user_already_exist });
    }

    await validatePassword(registerUser.password);
    await validateEmail(registerUser.email);

    return (
      await db
        .insert(Users)
        .values({
          ...registerUser,
          password: await CryptoUtils.getArgonHash(registerUser.password),
        })
        .returning()
    )[0];
  }

  static async login(
    { email, password }: { email: string; password: string },
    set: ElysiaCookie,
  ) {
    const user = await db.query.Users.findFirst({
      where: eq(Users.email, email),
    });

    if (!user) {
      await waitRandom();
      throw new BadRequest({ error: AuthErrors.account_not_found });
    }

    if (!(await CryptoUtils.compareArgonHash(password, user.password))) {
      await waitRandom();
      throw new BadRequest({ error: AuthErrors.account_not_found });
    }

    return AuthController.loginAndGenerateToken(user, set);
  }

  static async logout(req: ElysiaRequest) {
    const accessToken = await getAccessTokenFromRequest(req);

    await removeUserToken({
      db: db,
      tokensSchema: Tokens,
    })(accessToken!);

    req.cookie!.refresh.set({
      value: undefined,
    });

    return;
  }

  static async refresh(req: ElysiaRequest) {
    try {
      const refreshToken = req.cookie!.refresh.value;

      if (!refreshToken || refreshToken?.length < 0) {
        throw new BadRequest({ error: 'refresh_not_found' });
      }
      const { accessToken } = await refreshUserToken({
        db: db,
        tokensSchema: Tokens,
      })(refreshToken, {
        secret: env.JWT_ACCESS_SECRET!,
        refreshSecret: env.JWT_REFRESH_SECRET!,
        accessTokenTime: env.JWT_ACCESS_TIME!,
      });

      return {
        access_token: accessToken,
      };
    } catch (_error) {
      req.cookie!.refresh.set({
        value: undefined,
      });
      throw new BadRequest();
    }
  }

  static async getUserInfo(userContext: typeof Users.$inferSelect) {
    const { id, email, firstName, lastName } = userContext;

    return { id, email, firstName, lastName };
  }

  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await db.query.Users.findFirst({
      where: eq(Users.id, userId),
    });

    if (!user) {
      await waitRandom();
      throw new BadRequest({ error: AuthErrors.account_not_found });
    }

    if (!(await CryptoUtils.compareArgonHash(oldPassword, user.password))) {
      throw new BadRequest({ error: AuthErrors.password_error });
    }

    await validatePassword(newPassword);

    return db
      .update(Users)
      .set({ password: await CryptoUtils.getArgonHash(newPassword) })
      .where(eq(Users.id, userId));
  }

  static async askResetPassword(email: string) {
    const user = await db.query.Users.findFirst({
      where: eq(Users.email, email),
    });

    if (!user) {
      await waitRandom();
      throw new BadRequest({ error: AuthErrors.account_not_found });
    }

    const resetCode = faker.string.numeric(4);

    await db
      .update(Users)
      .set({ resetPasswordCode: resetCode })
      .where(eq(Users.id, user.id));

    return resetCode;
  }

  static async resetPassword(
    email: string,
    resetPasswordCode: string,
    password: string,
  ) {
    const user = await db.query.Users.findFirst({
      where: eq(Users.email, email),
    });

    if (!user) {
      await waitRandom();
      throw new BadRequest({ error: AuthErrors.account_not_found });
    }

    if (user.resetPasswordCode !== resetPasswordCode) {
      throw new BadRequest({ error: AuthErrors.wrong_reset_code });
    }

    await validatePassword(password);

    await db
      .update(Users)
      .set({
        resetPasswordCode: null,
        password: await CryptoUtils.getArgonHash(password),
      })
      .where(eq(Users.id, user.id));
  }
}

export default AuthController;
