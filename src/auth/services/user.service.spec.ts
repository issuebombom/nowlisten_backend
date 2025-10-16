import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole } from 'src/common/types/user-role.type';
import { User } from '../entities/user.entity';
import { BusinessException } from 'src/exception/business-exception';

const mockUserRepository = {
  findUserById: jest.fn(),
};
const mockPasswordService = {};
const mockRefreshTokenService = {};
const mockEventEmitter = {};

describe('UserService', () => {
  let service: UserService;
  let repository: typeof mockUserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    // 시나리오 1: 성공 케이스 테스트
    it('should return a user when a valid ID is provided', async () => {
      const userId = 'user-id';
      const fakeUser: User = {
        id: userId,
        name: 'test user',
        email: 'test@example.com',
        role: UserRole.User,
      } as User;

      repository.findUserById.mockResolvedValue(fakeUser);

      const result = await service.getUserById(userId);

      expect(result).toEqual(fakeUser);
      expect(repository.findUserById).toHaveBeenCalledWith(userId);
    });

    // 시나리오 2: 실패 케이스 테스트
    it('should throw a BusinessException if the user is not found', async () => {
      const userId = 'non-exists-id';
      repository.findUserById.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        BusinessException,
      );
      expect(repository.findUserById).toHaveBeenCalledWith(userId);
    });
  });
});
