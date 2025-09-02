export enum RedisNamespace {
  SOCIAL_LOGIN = 'social-login',
  RESET_PASSWORD = 'reset-password',
}

export function redisKey(
  ns: RedisNamespace,
  ...parts: (string | number)[]
): string {
  return [ns, ...parts].join(':');
}
