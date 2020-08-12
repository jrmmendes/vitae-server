import * as request from 'supertest';
import * as faker from 'faker/locale/pt_BR';

import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';

import { AccountsModule } from '../src/accounts/accounts.module';
import { AccountsService } from '../src/accounts/accounts.service';

describe('Accounts', () => {
  let app: INestApplication;
  let service: AccountsService;
  let configService: ConfigService;
  let validTestUserData: any;

  beforeAll(async (done) => {
    const module = await Test.createTestingModule({
      imports: [
        AccountsModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        MongooseModule.forRootAsync({
          useFactory: async () => {
            const mongod = new MongoMemoryServer();
            const uri = await mongod.getConnectionString();
            return {
              uri: uri
            }
          },
        }),
        MailerModule.forRoot(),
      ],
    })
    .overrideProvider(MailerService)
    .useValue({ sendMail: jest.fn() })
    .compile();

    app = module.createNestApplication();
    service = module.get<AccountsService>(AccountsService);

    validTestUserData = () => ({
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: "m3$3jdiii32-asdasd",
      passwordConfirmation: "m3$3jdiii32-asdasd",
    });

    await app.init();
    done();
  });

  it('When POST /users/login with valid credentials, expect 201 with a 30 days valid JWT', async (done) => {
    const server = app.getHttpServer();

    const testCredentials = {
      email: faker.internet.email(),
      password: "m3$3jdiii32-asdasd",
    }

    process.env.APP_SECRET = 'test-secret';

    const testUser = await service.registerUser({
      name: faker.name.findName(),
      email: testCredentials.email,
      password: testCredentials.password,
      passwordConfirmation: testCredentials.password,
    });

    const activationToken = await service.getActivationToken(testUser._id);
    await service.activateUser({ tokenValue: activationToken.value });

    const response = await request(server)
    .post('/users/login')
    .send({
      email: testCredentials.email,
      password: testCredentials.password,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      token: expect.any(String),
    });

    done();
  });

  it('When POST /users with valid data, expect 201 with registered user data', async (done) => {
    const server = app.getHttpServer();
    const response = await request(server)
    .post('/users')
    .send(validTestUserData());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
      isActive: expect.any(Boolean),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(response.body.isActive).toBe(false);
    done();
  });

  it('When POST /users/activation?token={validToken}, expect the account to be activated', async (done) => {
    const server = app.getHttpServer();

    const testUser = await service.registerUser(validTestUserData());

    const token = await service.getActivationToken(testUser._id);

    const response = await request(server)
    .get(`/users/activation?token=${token.value}`)
    .send();

    expect(response.status).toBe(200);
    done();
  });

  afterAll(async () => {
    await app.close();
  });
});
