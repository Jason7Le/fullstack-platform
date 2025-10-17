import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '用户密码',
    example: 'password123',
    minLength: 6,
    type: String,
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6位数' })
  password: string;

  @ApiProperty({
    description: '用户姓名',
    example: '张三',
    minLength: 2,
    type: String,
  })
  @IsString()
  @MinLength(2, { message: '姓名至少需要2个字符' })
  name: string;

  @ApiPropertyOptional({
    description: '用户角色',
    example: 'user',
    enum: ['admin', 'user', 'guest'],
    default: 'user',
  })
  @IsOptional()
  @IsEnum(['admin', 'user', 'guest'], {
    message: '角色必须是admin、user或者guest',
  })
  role?: string;
}
