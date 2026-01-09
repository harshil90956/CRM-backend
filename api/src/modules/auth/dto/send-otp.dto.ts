import { IsEmail, IsString } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsEmail()
  email: string;
}
