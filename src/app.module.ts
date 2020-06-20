import { join } from 'path';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [
    AccountsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        defaults: {
          from: '"Vitae | Dev Resumes" <vitae-platform@gmail.com>',
        },
        template: {
          dir: join(process.cwd(), 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        }
      }
    }),
  ],
})
export class AppModule {}
