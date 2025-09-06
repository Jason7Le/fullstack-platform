import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Roles } from '@fullstack-platform/common';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';

// 认证模块路由前缀：/auth
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // 注入认证服务
  constructor(private readonly authService: AuthService) {}

  // 用户登录：使用本地策略校验邮箱+密码
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req,
  ): Promise<LoginResponseDto> {
    // 通过服务生成访问令牌等信息
    return this.authService.login(loginDto);
  }

  // 用户注册：创建新用户
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功', type: LoginResponseDto })
  @ApiResponse({ status: 409, description: '邮箱已存在' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  // 获取当前用户信息：需要携带 Bearer Token
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  getProfile(@Request() req) {
    // user 由 JWT 策略在通过验证后附加
    return req.user;
  }

  // 仅管理员可访问的示例接口
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '管理员专属接口' })
  @ApiResponse({ status: 200, description: '访问成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  adminOnly(@Request() req) {
    return {
      message: '欢迎管理员',
      user: req.user,
    };
  }
}
