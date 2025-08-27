import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsPassword' })
class IsPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  defaultMessage() {
    return 'password must contain at least one letter, one number, and one special character';
  }
}

export function IsPassword(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsPasswordConstraint,
    });
  };
}
