import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { IJwtUserProfile } from '../interfaces/auth-guard-user.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import request from 'supertest';

const mockUserService = {
  getUserById: jest.fn(),
};

const mockAuthUser: IJwtUserProfile = {
  userId: 'test-user-id',
  iat: 123,
  jti: 'test-jti',
};

describe('UserController (Integration)', () => {
  let app: INestApplication;
  let service: typeof mockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockAuthUser;
          return true;
        },
      })
      .compile();

    service = module.get(UserService);

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return the user profile of the authenticated user', async () => {
      const fakeUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '010-1234-5678',
      };

      service.getUserById.mockResolvedValue(fakeUser);

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(fakeUser);
      expect(service.getUserById).toHaveBeenCalledWith(mockAuthUser.userId);
    });
  });
});
