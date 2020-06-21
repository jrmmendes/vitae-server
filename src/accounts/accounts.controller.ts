import { Controller, Post, Body, Get, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AccountsService } from './accounts.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('users')
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registers a new User' })
  @HttpCode(201)
  async register(@Body() registerUserDTO: RegisterUserDto): Promise<UserDto> {
    const user = await this
      .accountsService
      .registerUser(registerUserDTO);

    return new UserDto(user);
  }

  @Get('activation')
  @ApiOperation({ summary: 'Activate a user and invalidate activation token' })
  async activate(@Query('token') tokenValue: string) {
    await this.accountsService.activateUser({ tokenValue });
    return { message: 'user activated' };
  }
}
