import { HttpStatus, ValidationError } from '@nestjs/common';
import { BusinessException } from './business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';

export const validationExceptionFilter = (errors: ValidationError[]) => {
  const invalidProperties = errors.flatMap((error) => error.property);
  const validationErrorMessages = errors.flatMap((error) =>
    Object.values(error.constraints),
  );

  return new BusinessException(
    ErrorDomain.Validation,
    `invalid property: ${invalidProperties.join(', ')}`,
    `invalid field: ${invalidProperties.join(', ')}`,
    HttpStatus.BAD_REQUEST,
    validationErrorMessages,
  );
};
