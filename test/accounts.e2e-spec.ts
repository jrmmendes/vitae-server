import * as request from 'supertest';
import * as faker from 'faker/locale/pt_BR';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';

import { AccountsModule } from '../src/accounts/accounts.module';

describe('Accounts', () => {
  let app: INestApplication;

  beforeAll(async (done) => {
    const module = await Test.createTestingModule({
      imports: [
        AccountsModule,
        MongooseModule.forRootAsync({
          useFactory: async () => {
            const mongod = new MongoMemoryServer();
            const uri = await mongod.getConnectionString();
            return {
              uri: uri
            }
          },
        })
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    done();
  });

  it('/POST users', async (done) => {
    const server = app.getHttpServer();
    const response = await request(server)
    .post('/users')
    .send({
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: "m3$3jdiii32-asdasd",
      passwordConfirmation: "m3$3jdiii32-asdasd",
    });

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

  afterAll(async () => {
    await app.close();
  });
});
