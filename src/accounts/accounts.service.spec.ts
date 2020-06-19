import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as faker from 'faker/locale/pt_BR';

import { AccountsService } from './accounts.service';
import { User } from './schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import {BadRequestException} from '@nestjs/common';

describe('AccountsService', () => {
  let service: AccountsService;
  let model: Model<User>;

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
        }
      ]
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    model = module.get<Model<User>>(getModelToken('User'));
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
      jest.spyOn(model, 'exists').mockResolvedValue(false);
      jest.spyOn(model, 'create').mockResolvedValue({
        name: data.name,
        email: data.email,
        isActive: false,
        passwordHash: faker.random.alphaNumeric(12),
      } as User);

      const user = await service.registerUser(data);

      expect(user).toBeDefined();
    });

    it('When emails is already in use, expect 400 BadRequest', async () => {
      const invalidData: RegisterUserDto = {
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: faker.internet.password(13),
        passwordConfirmation: faker.internet.password(13),
      };

      jest.spyOn(model, 'exists').mockResolvedValue(true);

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

      jest.spyOn(model, 'exists').mockResolvedValue(false);

      await expect(service.registerUser(invalidData))
        .rejects
        .toThrowError(new BadRequestException('The passwords must be equal'))
      expect(model.create).not.toBeCalled();
    });
  });
});
