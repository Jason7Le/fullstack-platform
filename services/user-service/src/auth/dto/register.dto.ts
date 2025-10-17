import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  // ApiProperty：用于 OpenAPI( Swagger ) 文档生成，声明字段的示例值/描述/是否必填等
  @ApiProperty({ example: 'user@example.com', description: '邮箱' })
  // IsEmail：校验这是一个合法邮箱
  @IsEmail()
  email: string;

  // ApiProperty：声明密码字段的示例
  @ApiProperty({ example: 'password123' })
  // IsString：校验为字符串
  @IsString()
  // MinLength：限定最小长度，提升安全性
  @MinLength(6)
  password: string;

  // ApiProperty：用户显示名称
  @ApiProperty({ example: '张三' })
  @IsString()
  @MinLength(2)
  name: string;

  // ApiProperty：用户角色，非必填（required: false 表示在文档中展示为可选）
  @ApiProperty({ example: 'user', required: false })
  // IsOptional：该字段可选；若未提供将跳过此字段的后续校验
  @IsOptional()
  // IsEnum：校验该字段的值属于指定集合（此处为可用角色集合）
  // 说明：常见用法是传入一个 TypeScript 枚举；这里直接传入字符串集合达到同样效果。
  @IsEnum(['admin', 'user', 'guest'])
  role?: string;
}
