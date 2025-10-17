/**
 * 用户控制器
 *
 * 提供用户管理的 RESTful API 接口，包括：
 * - 用户创建、查询、更新、删除
 * - 用户统计信息获取
 * - 数据验证和错误处理
 *
 * 路由前缀：/users
 * 使用 TransformInterceptor 进行响应数据转换
 */
import { Roles } from '@fullstack-platform/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

/**
 * 用户控制器类
 * 处理用户相关的 HTTP 请求，提供 RESTful API 接口
 *
 * 装饰器说明：
 * - @Controller('users'): 定义路由前缀为 /users
 * - @UseInterceptors(TransformInterceptor): 应用数据转换拦截器
 *   确保返回的数据正确应用 class-transformer 转换规则
 */
@ApiTags('用户管理')
@Controller('users')
@UseInterceptors(TransformInterceptor) // 应用转换拦截器
@UseGuards(JwtAuthGuard, RolesGuard) // 应用JWT认证和角色权限守卫
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  /**
   * 构造函数
   * 注入用户服务，用于处理具体的业务逻辑
   *
   * @param usersService - 用户服务实例，提供用户管理的核心业务功能
   */
  constructor(private readonly usersService: UsersService) {
    // 测试日志是否工作
    this.logger.log('=== UsersController 初始化完成 ===');
    this.logger.log('Logger 测试: 如果你看到这条消息，说明日志功能正常');
  }

  /**
   * 创建新用户
   *
   * HTTP 方法：POST
   * 路由：/users
   * 状态码：201 Created
   * 权限：仅管理员可以创建用户
   *
   * @param createUserDto - 创建用户的数据传输对象
   *   包含：email（邮箱）、password（密码）、name（姓名）、role（角色，可选）
   * @returns Promise<UserResponseDto> - 返回创建成功的用户信息
   *
   * 请求示例：
   * POST /users
   * Authorization: Bearer <jwt_token>
   * {
   *   "email": "user@example.com",
   *   "password": "password123",
   *   "name": "张三",
   *   "role": "user"
   * }
   *
   * 响应示例：
   * {
   *   "id": 1,
   *   "email": "user@example.com",
   *   "name": "张三",
   *   "role": "user",
   *   "createdAt": "2024-01-01T00:00:00.000Z",
   *   "updatedAt": "2024-01-01T00:00:00.000Z",
   *   "isAdmin": false
   * }
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED) // 设置响应状态码为 201
  @Roles('admin') // 仅管理员可以创建用户
  @ApiOperation({
    summary: '创建用户',
    description: '管理员创建新用户账户',
  })
  @ApiBody({
    type: CreateUserDto,
    description: '用户创建信息',
    examples: {
      example1: {
        summary: '创建普通用户',
        value: {
          email: 'user@example.com',
          password: 'password123',
          name: '张三',
          role: 'user',
        },
      },
      example2: {
        summary: '创建管理员',
        value: {
          email: 'admin@example.com',
          password: 'admin123',
          name: '管理员',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '用户创建成功',
    type: UserResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`[创建用户]开始创建用户: ${createUserDto.email}`);
    this.logger.log(`[创建用户]请求数据:`, createUserDto);
    try {
      const result = await this.usersService.create(createUserDto);
      this.logger.log(`[创建用户]创建成功：${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[创建用户]创建用户失败: ${error.message}`,

        error.stack,
      );
      throw error;
    }
    // return this.usersService.create(createUserDto);
  }

  /**
   * 获取所有用户列表
   *
   * HTTP 方法：GET
   * 路由：/users
   * 状态码：200 OK
   * 权限：仅管理员可以查看所有用户
   *
   * @returns Promise<UserResponseDto[]> - 返回所有用户的数组
   *
   * 请求示例：
   * GET /users
   * Authorization: Bearer <jwt_token>
   *
   * 响应示例：
   * [
   *   {
   *     "id": 1,
   *     "email": "user1@example.com",
   *     "name": "张三",
   *     "role": "user",
   *     "createdAt": "2024-01-01T00:00:00.000Z",
   *     "updatedAt": "2024-01-01T00:00:00.000Z",
   *     "isAdmin": false
   *   },
   *   {
   *     "id": 2,
   *     "email": "admin@example.com",
   *     "name": "管理员",
   *     "role": "admin",
   *     "createdAt": "2024-01-01T00:00:00.000Z",
   *     "updatedAt": "2024-01-01T00:00:00.000Z",
   *     "isAdmin": true
   *   }
   * ]
   *
   * 注意：此接口返回所有用户，在生产环境中可能需要分页处理
   */
  @Get('list')
  @Roles('admin', 'user') // 仅管理员可以查看所有用户
  @ApiOperation({
    summary: '获取用户列表',
    description: '管理员获取所有用户列表',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [UserResponseDto],
  })
  async findAll(): Promise<UserResponseDto[]> {
    this.logger.log('[获取用户列表]开始获取所有用户列表');
    try {
      const result = await this.usersService.findAll();
      this.logger.log(`[获取用户列表]获取成功，共${result.length}个用户`);
      return result;
    } catch (error) {
      this.logger.error(
        `[获取用户列表]获取用户列表失败: ${error.message}`,

        error.stack,
      );
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   *
   * HTTP 方法：GET
   * 路由：/users/stats
   * 状态码：200 OK
   * 权限：仅管理员可以查看统计信息
   *
   * @returns Promise<{ total: number; byRole: Record<string, number> }> - 返回用户统计信息
   *
   * 请求示例：
   * GET /users/stats
   * Authorization: Bearer <jwt_token>
   *
   * 响应示例：
   * {
   *   "total": 100,
   *   "byRole": {
   *     "admin": 5,
   *     "user": 90,
   *     "guest": 5
   *   }
   * }
   *
   * 用途：用于管理后台显示用户统计信息、图表等
   */
  @Get('stats')
  @Roles('admin') // 仅管理员可以查看统计信息
  async getStats() {
    this.logger.log('[获取用户统计]开始获取用户统计信息');
    try {
      const result = await this.usersService.getUserStats();
      this.logger.log(`[获取用户统计]获取成功，总用户数: ${result.total}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[获取用户统计]获取统计信息失败: ${error.message}`,

        error.stack,
      );
      throw error;
    }
  }

  /**
   * 根据 ID 获取单个用户信息
   *
   * HTTP 方法：GET
   * 路由：/users/:id
   * 状态码：200 OK
   * 权限：管理员和普通用户都可以查看用户信息
   *
   * @param id - 用户唯一标识符
   *   @Param('id') 从 URL 路径参数中获取
   *   ParseIntPipe 自动将字符串转换为整数，如果转换失败返回 400 错误
   * @returns Promise<UserResponseDto> - 返回指定用户的信息
   *
   * 请求示例：
   * GET /users/1
   * Authorization: Bearer <jwt_token>
   *
   * 响应示例：
   * {
   *   "id": 1,
   *   "email": "user@example.com",
   *   "name": "张三",
   *   "role": "user",
   *   "createdAt": "2024-01-01T00:00:00.000Z",
   *   "updatedAt": "2024-01-01T00:00:00.000Z",
   *   "isAdmin": false
   * }
   *
   * 异常处理：
   * - 400 Bad Request: ID 参数不是有效的整数
   * - 404 Not Found: 用户不存在
   */
  @Get('detail/:id')
  @Roles('admin', 'user') // 管理员和普通用户都可以查看用户信息
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据ID获取用户详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'number',
    example: 1,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    this.logger.log(`[获取用户详情]开始获取用户信息，ID: ${id}`);
    try {
      const result = await this.usersService.findOne(id);
      this.logger.log(
        `[获取用户详情]获取成功，用户: ${result.name}(${result.email})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[获取用户详情]获取用户信息失败，ID: ${id}, 错误: ${error.message}`,

        error.stack,
      );
      throw error;
    }
  }

  /**
   * 更新用户信息
   *
   * HTTP 方法：PATCH
   * 路由：/users/:id
   * 状态码：200 OK
   * 权限：仅管理员可以更新用户信息
   *
   * @param id - 用户唯一标识符
   *   @Param('id') 从 URL 路径参数中获取
   *   ParseIntPipe 自动将字符串转换为整数
   * @param updateUserDto - 更新用户的数据传输对象
   *   @Body() 从请求体中获取，支持部分字段更新
   *   可选字段：email（邮箱）、password（密码）、name（姓名）、role（角色）
   * @returns Promise<UserResponseDto> - 返回更新后的用户信息
   *
   * 请求示例：
   * PATCH /users/1
   * Authorization: Bearer <jwt_token>
   * {
   *   "name": "新姓名",
   *   "role": "admin"
   * }
   *
   * 响应示例：
   * {
   *   "id": 1,
   *   "email": "user@example.com",
   *   "name": "新姓名",
   *   "role": "admin",
   *   "createdAt": "2024-01-01T00:00:00.000Z",
   *   "updatedAt": "2024-01-02T00:00:00.000Z",
   *   "isAdmin": true
   * }
   *
   * 异常处理：
   * - 400 Bad Request: ID 参数无效或密码强度不符合要求
   * - 404 Not Found: 用户不存在
   * - 409 Conflict: 邮箱已被其他用户使用
   */
  @Patch('update:id')
  // @Roles('admin') // 仅管理员可以更新用户信息
  @ApiOperation({
    summary: '更新用户信息',
    description: '管理员更新用户信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'number',
    example: 1,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`[更新用户]开始更新用户信息，ID: ${id}`);
    this.logger.log(`[更新用户]更新数据:`, updateUserDto);
    try {
      const result = await this.usersService.update(id, updateUserDto);
      this.logger.log(
        `[更新用户]更新成功，用户: ${result.name}(${result.email})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[更新用户]更新用户信息失败，ID: ${id}, 错误: ${error.message}`,

        error.stack,
      );
      throw error;
    }
  }

  /**
   * 删除用户
   *
   * HTTP 方法：DELETE
   * 路由：/users/:id
   * 状态码：204 No Content
   * 权限：仅管理员可以删除用户
   *
   * @param id - 用户唯一标识符
   *   @Param('id') 从 URL 路径参数中获取
   *   ParseIntPipe 自动将字符串转换为整数
   * @returns Promise<void> - 删除操作不返回数据
   *
   * 请求示例：
   * DELETE /users/1
   * Authorization: Bearer <jwt_token>
   *
   * 响应：无响应体，状态码 204
   *
   * 异常处理：
   * - 400 Bad Request: ID 参数不是有效的整数
   * - 404 Not Found: 用户不存在
   *
   * 注意：删除操作不可逆，请谨慎使用
   */
  @Delete('remove/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // 设置响应状态码为 204
  @Roles('admin') // 仅管理员可以删除用户
  @ApiOperation({
    summary: '删除用户',
    description: '管理员删除用户账户',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: 'number',
    example: 1,
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`[删除用户]开始删除用户，ID: ${id}`);
    try {
      await this.usersService.remove(id);
      this.logger.log(`[删除用户]删除成功，ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `[删除用户]删除用户失败，ID: ${id}, 错误: ${error.message}`,

        error.stack,
      );
      throw error;
    }
  }
}
