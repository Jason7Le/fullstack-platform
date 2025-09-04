import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usr@example.com', description: '登录邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: '登录密码' })
  @IsString()
  @MinLength(6)
  password: string;
}
