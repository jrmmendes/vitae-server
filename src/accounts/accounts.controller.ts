import { Controller, Post, Body } from '@nestjs/common';
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
  async register(@Body() registerUserDTO: RegisterUserDto): Promise<UserDto> {
    const user = await this
      .accountsService
      .registerUser(registerUserDTO);

    return new UserDto(user);
  }
}
