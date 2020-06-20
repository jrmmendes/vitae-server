import { hash } from 'bcryptjs';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import {ActivationToken} from './schemas/token.schema';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    
    @InjectModel(ActivationToken.name)
    private readonly activationTokenModel: Model<ActivationToken>,
  ) {}

  async getActivationToken(userId: number): Promise<ActivationToken> {
    const user = await this
      .userModel
      .findById(userId);
    
    const tokenValue = await hash(`${user.name}${user.email}${Date.now()}`, 10);

    return this
      .activationTokenModel
      .create({ value: tokenValue });
  }

  async registerUser(user: RegisterUserDto): Promise<User> {
    if (await this.userModel.exists({ email: user.email })) {
      throw new BadRequestException('That email is not available');
    }

    if (user.password !== user.passwordConfirmation) {
      throw new BadRequestException('The passwords must be equal');
    }

    const passwordHash = await hash(user.password, 10); 
    return this.userModel.create({
      name: user.name,
      email: user.email,
      isActive: false,
      passwordHash,
    });
  }
}
