import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class LoginCredentialsDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
