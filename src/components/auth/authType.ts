import { Field, InputType, ObjectType, registerEnumType } from 'type-graphql';

@ObjectType()
export class User {
  @Field(() => String, {
    nullable: false,
  })
  id: string;

  @Field(() => String, {
    nullable: false,
  })
  firstName: string;

  @Field(() => String, {
    nullable: true,
  })
  lastName?: string | null;

  @Field(() => String, {
    nullable: false,
  })
  email: string;

  @Field(() => Date, {
    nullable: false,
  })
  createdAt: Date;

  @Field(() => Date, {
    nullable: false,
  })
  updatedAt: Date;
}

@InputType()
export class UserRegister {
  @Field(() => String, {
    nullable: false,
  })
  firstName!: string;

  @Field(() => String, {
    nullable: false,
  })
  lastName!: string;

  @Field(() => String, {
    nullable: false,
  })
  email!: string;

  @Field(() => String, {
    nullable: false,
  })
  password!: string;
}

export enum AuthErrors {
  user_already_exist = 'user_already_exist',
  account_not_found = 'account_not_found',
  password_validation_error = 'password_validation_error',
  password_error = 'password_error',
  wrong_reset_code = 'wrong_reset_code',
  email_not_valid = 'email_not_valid',
}

registerEnumType(AuthErrors, {
  name: 'AuthErrors',
});
