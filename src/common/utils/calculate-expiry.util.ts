import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from '../types/error-domain.type';
import { HttpStatus } from '@nestjs/common';

export const calculateExpiry = (expiresIn: string, baseTime?: Date): Date => {
  const durationTime = parseInt(expiresIn.slice(0, -1), 10);
  const timeFormat = expiresIn.slice(-1);

  let milliseconds: number;

  switch (timeFormat) {
    case 'd':
      milliseconds = durationTime * 24 * 60 * 60 * 1000; // days -> ms
      break;
    case 'h':
      milliseconds = durationTime * 60 * 60 * 1000; // hours -> ms
      break;
    case 'm':
      milliseconds = durationTime * 60 * 1000; // minutes -> ms
      break;
    case 's':
      milliseconds = durationTime * 1000; // seconds -> ms
      break;
    default:
      throw new BusinessException(
        ErrorDomain.Generic,
        `invalid duration string: ${expiresIn}`,
        `invalid duration string: ${expiresIn}`,
        HttpStatus.BAD_REQUEST,
      );
  }
  return new Date((Number(baseTime) || Date.now()) + milliseconds);
};
