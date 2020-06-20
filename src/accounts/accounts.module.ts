import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { User, UserSchema } from './schemas/user.schema';
import { ActivationToken, ActivationTokenSchema } from './schemas/token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema,
    },{
      name: ActivationToken.name,
      schema: ActivationTokenSchema,
    }])
  ],
  providers: [AccountsService],
  controllers: [AccountsController]
})
export class AccountsModule {}
