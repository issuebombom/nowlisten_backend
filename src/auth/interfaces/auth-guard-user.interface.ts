import { SocialProvider } from 'src/common/types/social-provider.type';

export interface IJwtUserProfile {
  userId: string;
  iat: number;
  jti: string;
}

export interface ISocialUserProfile {
  providerId: string;
  email: string;
  name: string;
  imageUrl: string;
  provider: SocialProvider;
}
