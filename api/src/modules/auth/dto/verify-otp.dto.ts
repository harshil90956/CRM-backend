import { IsEmail, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  otp: string;
}
