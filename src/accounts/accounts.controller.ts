import { Controller, Post, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
  ) {}

  @Post()
  async register(@Body() registerUserDTO: RegisterUserDto): Promise<UserDto> {
    const user = await this
      .accountsService
      .registerUser(registerUserDTO);

    return new UserDto(user);
  }
}
