import { Roles } from '@fullstack-platform/common';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { LoginResponseDto, RefreshTokenDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';

// 用户信息类型定义
interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
// 认证模块路由前缀：/auth
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  // 注入认证服务
  constructor(private readonly authService: AuthService) {}

  // 用户登录：使用本地策略校验邮箱+密码
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(
    @Request() req: { user: AuthenticatedUser },
    @Body() rememberMe: boolean,
  ): Promise<LoginResponseDto> {
    // 直接使用 LocalStrategy 验证后的用户信息
    this.logger.log('登录请求', req.user);
    try {
      const result = await this.authService.generateToken(req.user, rememberMe);
      this.logger.log('登录成功', result);
      return result;
    } catch (error) {
      this.logger.error('登录失败', error);
      throw error;
    }
  }

  // 用户登出
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async logout(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<{ message: string }> {
    this.logger.log('用户登出', req.user);
    try {
      await this.authService.revokeRefreshToken(req.user.id);
      this.logger.log('登出成功');
      return { message: '登出成功' };
    } catch (error) {
      this.logger.error('登出失败', error);
      throw error;
    }
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

  // 刷新访问令牌
  @Post('refreshToken')
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({ status: 200, description: '刷新成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '无效的刷新令牌' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    this.logger.log('刷新访问令牌请求', refreshTokenDto);
    try {
      const result = await this.authService.refreshAccessToken(refreshTokenDto);
      this.logger.log('刷新成功', result);
      return result;
    } catch (error) {
      this.logger.error('刷新失败', error);
      throw error;
    }
  }

  // 获取当前用户信息：需要携带 Bearer Token
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  getProfile(@Request() req: { user: AuthenticatedUser }) {
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
  adminOnly(@Request() req: { user: AuthenticatedUser }) {
    return {
      message: '欢迎管理员',
      user: req.user,
    };
  }
}
