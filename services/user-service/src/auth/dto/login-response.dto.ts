import { ApiProperty } from '@nestjs/swagger';

// JWT payload 类型定义
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

// 登录响应类型定义
export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '用户信息',
    example: {
      id: 1,
      email: 'user@example.com',
      name: '张三',
      role: 'user',
    },
  })
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}
