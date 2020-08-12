import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { EmailContext } from '@/common/email-context.interface';

import { User } from './schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { ActivationToken } from './schemas/token.schema';

type ActivateUserParams = {
  tokenValue: string;
}

type Credentials = {
  email: string;
  password: string;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    
    @InjectModel(ActivationToken.name)
    private readonly activationTokenModel: Model<ActivationToken>,

    private readonly configService: ConfigService,

    private readonly mailerService: MailerService,
  ) {}

  async getAuthorizationToken({ email, password }: Credentials): Promise<string> {
    const user = await this.userModel.findOne({ email, isActive: true });
    if (!user) {
      throw new BadRequestException('Email or password is wrong');
    }
    const hasValidCredentials = await compare(password, user?.passwordHash);
    
    if (!hasValidCredentials) {
      throw new BadRequestException('Email or password is wrong');
    }
    
    const secretOrPrivateKey = this
      .configService
      .get<string>('APP_SECRET');

    return sign({
      id: user.id,
      loginAt: (new Date()).toISOString(),
    }, secretOrPrivateKey);

  }
  async activateUser({ tokenValue }: ActivateUserParams ): Promise<void> {
    const token = await this.activationTokenModel.findOne({ value: tokenValue });

    if (!token) {
      throw new BadRequestException('That token is not valid');
    }
    
    if (token.hasBeenUsed) {
      throw new BadRequestException('That token has already been used');
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

  async getActivationToken(userId: string): Promise<ActivationToken> {

    const alreadyExistentToken = await this
      .activationTokenModel
      .findOne({ userId });

    alreadyExistentToken?.deleteOne();

    const user = await this
      .userModel
      .findById(userId);

    if(!user) {
      throw new NotFoundException('User not found');
    }
    
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

  async sendActivationEmail(
    activationToken: ActivationToken,
    user: User,
  ): Promise<void> {
    const context :EmailContext = {
      helloMessage: user.name,
      message: `Seja bem vindo à PLAAD! Clique no botão abaixo para confirmar seu email:`,
      cta: {
        text: 'Confirmar email',
        href: `http://localhost:3000/accounts/activation?token=${activationToken.value}`,
      },
    }
    this.mailerService.sendMail({
      to: user.email,
      from: 'PLAAD <no-reply@plaad.com.br',
      subject: 'Activate account',
      template: 'generic',
      context,
    });
  }
}
