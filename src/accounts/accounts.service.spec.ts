import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as faker from 'faker/locale/pt_BR';
import { BadRequestException } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from './schemas/user.schema';
import { ActivationToken } from './schemas/token.schema';

describe('Accounts Service', () => {
  let service: AccountsService;
  let userModel: Model<User>;
  let activationTokenModel: Model<ActivationToken>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getModelToken('User'),
          useValue: {
            exists: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          }
        },
        {
          provide: getModelToken('ActivationToken'),
          useValue: {
            exists: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
          }
        }
      ]
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    userModel = module.get<Model<User>>(getModelToken('User'));
    activationTokenModel = module.get<Model<ActivationToken>>(getModelToken('ActivationToken'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('User Creation', () => {
    it('When input data is valid, expect to create the user', async () => {
      const testPassword = faker.internet.password(12);
      const data: RegisterUserDto = {
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: testPassword,
        passwordConfirmation: testPassword,
      };
      
      const passwordHash = faker.random.alphaNumeric(12);

      const createdUser = {
        _id: faker.random.alphaNumeric(),
        name: data.name,
        email: data.email,
        isActive: false,
        passwordHash,
        createdAt: (new Date()).toISOString(),
        updatedAt: (new Date()).toISOString(),
      };

      jest.spyOn(userModel, 'exists').mockResolvedValue(false);
      jest.spyOn(userModel, 'create').mockResolvedValue(createdUser as any);

      const user = await service.registerUser(data);

      expect(user).toBeDefined();
      expect(userModel.create).toBeCalledWith({
        name: expect.any(String),
        email: expect.any(String),
        isActive: false,
        passwordHash: expect.any(String),
      });
      expect(user).toMatchObject({
        _id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        isActive: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('When emails is already in use, expect 400 BadRequest', async () => {
      const invalidData: RegisterUserDto = {
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(13),
        passwordConfirmation: faker.internet.password(13),
      };

      jest.spyOn(userModel, 'exists').mockResolvedValue(true);

      await expect(service.registerUser(invalidData))
        .rejects
        .toThrowError(new BadRequestException('That email is not available'))
    });

    it('When passwords are different, expect to throw 400 BadRequest', async () => {
      const invalidData: RegisterUserDto = {
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(13),
        passwordConfirmation: faker.internet.password(15),
      };

      jest.spyOn(userModel, 'exists').mockResolvedValue(false);

      await expect(service.registerUser(invalidData))
        .rejects
        .toThrowError(new BadRequestException('The passwords must be equal'))
      expect(userModel.create).not.toBeCalled();
    });
  });

  describe('User Activation', () => {
    it('When valid token is passed, expect to activate the user and mark token as used', async (done) => {
      const testUser = {
        _id: faker.random.alphaNumeric(13),
        name: faker.name.findName(),
        email: faker.internet.email(),
        isActive: false,
      } as User;

      const testActivationToken = {
        _id: faker.random.alphaNumeric(13),
        value: faker.random.alphaNumeric(13),
        hasBeenUsed: false,
      } as ActivationToken;

      testActivationToken.save = jest.fn();
      testUser.save = jest.fn();

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValue(testUser);

      jest
        .spyOn(activationTokenModel, 'findOne')
        .mockResolvedValue(testActivationToken);

      await service.activateUser({
        tokenValue: testActivationToken.value,
      });

      expect(testUser.save).toBeCalled();
      expect(testActivationToken.save).toBeCalled();
      expect(testActivationToken.hasBeenUsed).toBe(true);
      expect(testUser.isActive).toBe(true);
      
      done();
    });
  });

  describe('Activation Token Generation', () => {
    it('When the passed users exists, expect to return a valid activation token', async (done) => {
      const testUser = {
        _id: faker.random.alphaNumeric(13),
        name: faker.name.findName(),
        email: faker.internet.email(),
        isActive: false,
      } as User;

      jest
        .spyOn(userModel, 'findById')
        .mockResolvedValue(testUser);

      jest
        .spyOn(activationTokenModel, 'create')
        .mockImplementation((tokenOpts: ActivationToken) => new Promise(
          resolve => resolve({
            _id: faker.random.alphaNumeric(12),
            value: tokenOpts.value,
            hasBeenUsed: false,
            createdAt: (new Date()).toISOString(),
            updatedAt: (new Date()).toISOString(),
          } as any),
        ));

      const { value, hasBeenUsed } = await service
        .getActivationToken(testUser._id);

      expect({ value, hasBeenUsed })
        .toMatchObject({ 
        value: expect.any(String),
        hasBeenUsed: false,
      });
      done();
    });
  });
});
