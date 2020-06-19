import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema,
    }])
  ],
  providers: [AccountsService]
})
export class AccountsModule {}
