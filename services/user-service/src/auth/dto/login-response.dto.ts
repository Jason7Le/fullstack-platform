import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// JWT payload 数据类型定义
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

// 登录响应Dto数据类型定义
export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: '用户信息',
    example: {
      id: 1,
      email: 'user@example.com',
      name: '张三',
      role: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// 刷新token请求Dto
export class RefreshTokenDto {
  // API 属性
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string;
}
