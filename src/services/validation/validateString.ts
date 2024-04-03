import { BadRequest } from 'unify-errors';
import z from 'zod';

import { AuthErrors } from '../../components/auth/authType';

export const validatePassword = (password: string) => {
  if (!password) {
    throw new BadRequest({ error: AuthErrors.password_validation_error });
  }

  if (password?.length < 8) {
    throw new BadRequest({ error: AuthErrors.password_validation_error });
  }

  if (password?.length > 20) {
    throw new BadRequest({ error: AuthErrors.password_validation_error });
  }
};

export const validateEmail = (email: string) => {
  const schema = z.string().email();

  if (schema.safeParse(email).success === false) {
    throw new BadRequest({ error: AuthErrors.email_not_valid });
  }
};
