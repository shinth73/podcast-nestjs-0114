import { JwtService } from './../jwt/jwt.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token-baby'),
  verify: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: UserRole.Host,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
      expect(result).toEqual({ ok: true, error: null });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: 'Could not create account' });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'bs@email.com',
      password: 'bs.password',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    it('should return token if password corrent', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'signed-token-baby' });
    });

    it('should fail on exception', async () => {
      const error = new Error();
      usersRepository.findOne.mockRejectedValue(error);
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error });
    });
  });

  describe('findById', () => {
    const findByIdArgs = {
      id: 1,
    };
    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if no user was found', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: 'bs@old.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        input: { email: 'bs@new.com' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        verified: false,
        email: editProfileArgs.input.email,
      };

      usersRepository.findOne.mockResolvedValue(oldUser);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        editProfileArgs.userId,
      );
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'new.password' },
      };
      usersRepository.findOne.mockResolvedValue({ password: 'old' });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '12' });
      expect(result).toEqual({ ok: false, error: 'Could not update profile' });
    });
  });
});
