export enum RedisNamespace {
  SOCIAL_LOGIN = 'social-login',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFY = 'email-verify',
}

export function joinRedisKey(ns: RedisNamespace, ...parts: string[]): string {
  return [ns, ...parts].join(':');
}
