import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AccountsService } from './accounts.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserDto } from './dto/user.dto';
import { LoginCredentialsDto } from './dto/login-credentials.dto';

@ApiTags('Users')
@Controller('users')
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registers a new User' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDTO: RegisterUserDto): Promise<UserDto> {
    const user = await this
      .accountsService
      .registerUser(registerUserDTO);

    const activationToken = await this
      .accountsService
      .getActivationToken(user.id);
    
    this
      .accountsService
      .sendActivationEmail(activationToken, user);

    return new UserDto(user);
  }

  @Get('activation')
  @ApiOperation({ summary: 'Activate a user and invalidate activation token' })
  async activate(@Query('token') tokenValue: string) {
    await this.accountsService.activateUser({ tokenValue });
    return { message: 'user activated' };
  }

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Returns a JWT token if valid credentials are provided' })
  async login(@Body() credentials: LoginCredentialsDto ) {
    const token = await this.accountsService.getAuthorizationToken(credentials);
    return { token };
  }
}
