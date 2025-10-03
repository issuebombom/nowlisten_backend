import { camelCase } from 'lodash';

export const keysToCamel = (row: Record<string, any>) => {
  const obj = {};
  for (const key in row) {
    obj[camelCase(key)] = row[key];
  }
  return obj;
};
