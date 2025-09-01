import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsNotReservedWord(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isNotReservedWord',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(workspaceName: string) {
          if (typeof workspaceName !== 'string') return false;
          const hasContained = RESERVED_WORDS_SET.has(
            workspaceName.toLowerCase(),
          );
          return !hasContained;
        },
        defaultMessage(args: ValidationArguments) {
          return `"${args.value}" can't use the workspace name`;
        },
      },
    });
  };
}

// 필수적으로 포함해야 할 예약어들
const SYSTEM_AND_MANAGEMENT = [
  'www',
  'api',
  'admin',
  'support',
  'status',
  'dashboard',
  'help',
  'billing',
  'account',
  'user',
  'users',
  'blog',
  'forum',
  'app',
  'web',
  'dev',
  'test',
  'beta',
];

const SECURITY_AND_AUTH = [
  'auth',
  'login',
  'logout',
  'signup',
  'signin',
  'register',
  'password',
  'reset',
  'activate',
];

const FILE_AND_PATH = [
  'images',
  'img',
  'assets',
  'files',
  'uploads',
  'static',
  'media',
  'pages',
  'docs',
  'documentation',
];

const COMPANY_AND_BRAND = [
  'about',
  'contact',
  'careers',
  'press',
  'privacy',
  'terms',
  'tos',
  'policy',
];

// 추가적으로 고려할 만한 예약어들
const SPECIAL_FEATURES = [
  'feed',
  'search',
  'home',
  'shop',
  'store',
  'community',
  'guide',
  'explore',
  'discover',
];

const TECHNICAL_TERMS = ['http', 'https', 'ftp', 'ssh', 'git', 'oauth', 'smtp'];

const GEOGRAPHICAL_AND_LANGUAGE = ['us', 'kr', 'jp', 'en', 'ko'];

const SOCIAL_MEDIA = [
  'twitter',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'github',
];

const RESERVED_WORDS_SET = new Set([
  ...SYSTEM_AND_MANAGEMENT,
  ...SECURITY_AND_AUTH,
  ...FILE_AND_PATH,
  ...COMPANY_AND_BRAND,
  ...SPECIAL_FEATURES,
  ...TECHNICAL_TERMS,
  ...GEOGRAPHICAL_AND_LANGUAGE,
  ...SOCIAL_MEDIA,
]);
