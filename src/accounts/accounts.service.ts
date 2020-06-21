import { hash } from 'bcryptjs';
import { Injectable, BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { ActivationToken } from './schemas/token.schema';

type ActivateUserParams = {
  tokenValue: string;
};

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    
    @InjectModel(ActivationToken.name)
    private readonly activationTokenModel: Model<ActivationToken>,
  ) {}

  async activateUser({ tokenValue }: ActivateUserParams ): Promise<void> {
    const token = await this.activationTokenModel.findOne({ value: tokenValue });

    if (!token) {
      throw new NotFoundException('The token could not be found');
    }
    
    if (token.hasBeenUsed) {
      throw new UnprocessableEntityException('That token has already been used');
    }
    
    const user = await this.userModel.findById(token.userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    token.hasBeenUsed = true;
    
    await token.save();
    await user.save();
  }

  async getActivationToken(userId: number): Promise<ActivationToken> {
    const user = await this
      .userModel
      .findById(userId);
    
    const tokenValue = await hash(`${user.name}${user.email}${Date.now()}`, 10);

    return this
      .activationTokenModel
      .create({
        value: tokenValue,
        userId: user.id,
      });
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
