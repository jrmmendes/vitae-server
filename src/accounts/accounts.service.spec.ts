import { hash } from 'bcryptjs';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as faker from 'faker/locale/pt_BR';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from './schemas/user.schema';
import { ActivationToken } from './schemas/token.schema';
import {ConfigModule} from '@nestjs/config';

describe('Accounts Service', () => {
  let service: AccountsService;
  let userModel: Model<User>;
  let activationTokenModel: Model<ActivationToken>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        AccountsService,
        {
          provide: getModelToken('User'),
          useValue: {
            exists: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
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
    it('When the userId has a invalid field, expect to throw Not Found exception', async (done) => {

      const testToken = {
        _id: faker.random.alphaNumeric(13),
        value: faker.random.alphaNumeric(13),
        hasBeenUsed: false,
      } as ActivationToken;

      jest
      .spyOn(userModel, 'findById')
      .mockResolvedValue(undefined);

      jest
      .spyOn(activationTokenModel, 'findOne')
      .mockResolvedValue(testToken);


      await expect(service.activateUser({
        tokenValue: testToken.value,
      }))
      .rejects
      .toThrowError(new NotFoundException('User not found'));

      done();
    });

    it('When an invalid token is passed, expect to throw Bad Request exception', async (done) => {
      const testUser = {
        _id: faker.random.alphaNumeric(13),
        name: faker.name.findName(),
        email: faker.internet.email(),
        isActive: false,
      } as User;

      testUser.save = jest.fn();

      jest
      .spyOn(userModel, 'findById')
      .mockResolvedValue(testUser);

      jest
      .spyOn(activationTokenModel, 'findOne')
      .mockResolvedValue(undefined);

      await expect(service.activateUser({
        tokenValue: faker.random.alphaNumeric(13),
      }))
      .rejects
      .toThrowError(new BadRequestException('That token is not valid'));

      expect(testUser.save).not.toBeCalled();
      expect(testUser.isActive).toBe(false);

      done();
    });
    it('When an already used token is passed, expect to throw Bad Request exception', async (done) => {
      const testUser = {
        _id: faker.random.alphaNumeric(13),
        name: faker.name.findName(),
        email: faker.internet.email(),
        isActive: false,
      } as User;

      testUser.save = jest.fn();

      const alreadyUsedToken = {
        _id: faker.random.alphaNumeric(13),
        value: faker.random.alphaNumeric(13),
        hasBeenUsed: true,
      } as ActivationToken;

      jest
      .spyOn(userModel, 'findById')
      .mockResolvedValue(testUser);

      jest
      .spyOn(activationTokenModel, 'findOne')
      .mockResolvedValue(alreadyUsedToken);


      await expect(service.activateUser({
        tokenValue: alreadyUsedToken.value,
      }))
      .rejects
      .toThrowError(new BadRequestException('That token has already been used'));

      expect(testUser.save).not.toBeCalled();
      expect(testUser.isActive).toBe(false);

      done();
    });

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
    it('When there is another valid token, expect to delete it and create a new one', async (done) => {
      const testUser = {
        _id: faker.random.alphaNumeric(13),
        name: faker.name.findName(),
        email: faker.internet.email(),
        isActive: false,
      } as User;

      const alreadyExistentToken = {
        _id: faker.random.alphaNumeric(12),
        value: faker.random.alphaNumeric(13),
        userId: testUser._id,
        hasBeenUsed: false,
      } as ActivationToken;

      alreadyExistentToken.deleteOne = jest.fn();

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

      jest.spyOn(activationTokenModel, 'findOne').mockResolvedValue(alreadyExistentToken)

      const { value, hasBeenUsed } = await service
      .getActivationToken(testUser._id);

      expect({ value, hasBeenUsed })
      .toMatchObject({ 
        value: expect.any(String),
        hasBeenUsed: false,
      });

      expect(activationTokenModel.findOne).toBeCalled();
      expect(alreadyExistentToken.deleteOne).toBeCalled();

      done();
      
    });

    it('When the user did not exists, expect to throw a not found error', async (done) => {
      jest
      .spyOn(userModel, 'findById')
      .mockResolvedValue(undefined);

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

      await expect(service.getActivationToken(faker.random.alphaNumeric(13)))
      .rejects
      .toThrowError(new NotFoundException('User not found'));

      done();
    });

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

  describe('Account Login', () => {
    it('When valid credentials are provided, expect to generate jwt token', async (done) => {
      const testCredentials = {
        email: faker.internet.email(),
        password: faker.internet.password(12, false),
      };

      const passwordHash = await hash(testCredentials.password, 10);

      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        _id: faker.random.alphaNumeric(),
        name: faker.name.findName(),
        email: testCredentials.email,
        passwordHash,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const jwt = await service.getAuthorizationToken(testCredentials);

      expect(jwt).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
      done();
    });
  });
});
