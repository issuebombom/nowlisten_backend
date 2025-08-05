import { HttpStatus, ValidationError } from '@nestjs/common';
import { BusinessException } from './business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';

export const validationExceptionFilter = (errors: ValidationError[]) => {
  const firstValidationError = errors[0];
  // 방어 코드
  if (!firstValidationError) {
    return new BusinessException(
      ErrorDomain.Validation,
      'Validation failed, but no errors were provided',
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  const invalidProperty = firstValidationError.property;
  const constraints = firstValidationError.constraints;
  // 에러메시지 출력 우선순위 선정을 위한 코드 (Length 에러 고정 포함 이슈)
  const apiMessage =
    constraints.isNotEmpty ||
    constraints.isString ||
    constraints.isNumber ||
    constraints.whitelistValidation ||
    Object.values(firstValidationError.constraints)[0];

  return new BusinessException(
    ErrorDomain.Validation,
    `invalid property: ${invalidProperty}`,
    apiMessage,
    HttpStatus.BAD_REQUEST,
  );
};
