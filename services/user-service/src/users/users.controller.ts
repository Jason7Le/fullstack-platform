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
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

/**
 * 用户控制器类
 * 处理用户相关的 HTTP 请求，提供 RESTful API 接口
 * 
 * 装饰器说明：
 * - @Controller('users'): 定义路由前缀为 /users
 * - @UseInterceptors(TransformInterceptor): 应用数据转换拦截器
 *   确保返回的数据正确应用 class-transformer 转换规则
 */
@Controller('users')
@UseInterceptors(TransformInterceptor) // 应用转换拦截器
export class UsersController {
  /**
   * 构造函数
   * 注入用户服务，用于处理具体的业务逻辑
   * 
   * @param usersService - 用户服务实例，提供用户管理的核心业务功能
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * 创建新用户
   * 
   * HTTP 方法：POST
   * 路由：/users
   * 状态码：201 Created
   * 
   * @param createUserDto - 创建用户的数据传输对象
   *   包含：email（邮箱）、password（密码）、name（姓名）、role（角色，可选）
   * @returns Promise<UserResponseDto> - 返回创建成功的用户信息
   * 
   * 请求示例：
   * POST /users
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
  @Post()
  @HttpCode(HttpStatus.CREATED) // 设置响应状态码为 201
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  /**
   * 获取所有用户列表
   * 
   * HTTP 方法：GET
   * 路由：/users
   * 状态码：200 OK
   * 
   * @returns Promise<UserResponseDto[]> - 返回所有用户的数组
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
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  /**
   * 获取用户统计信息
   * 
   * HTTP 方法：GET
   * 路由：/users/stats
   * 状态码：200 OK
   * 
   * @returns Promise<{ total: number; byRole: Record<string, number> }> - 返回用户统计信息
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
  getStats() {
    return this.usersService.getUserStats();
  }

  /**
   * 根据 ID 获取单个用户信息
   * 
   * HTTP 方法：GET
   * 路由：/users/:id
   * 状态码：200 OK
   * 
   * @param id - 用户唯一标识符
   *   @Param('id') 从 URL 路径参数中获取
   *   ParseIntPipe 自动将字符串转换为整数，如果转换失败返回 400 错误
   * @returns Promise<UserResponseDto> - 返回指定用户的信息
   * 
   * 请求示例：
   * GET /users/1
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
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * 更新用户信息
   * 
   * HTTP 方法：PATCH
   * 路由：/users/:id
   * 状态码：200 OK
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
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * 删除用户
   * 
   * HTTP 方法：DELETE
   * 路由：/users/:id
   * 状态码：204 No Content
   * 
   * @param id - 用户唯一标识符
   *   @Param('id') 从 URL 路径参数中获取
   *   ParseIntPipe 自动将字符串转换为整数
   * @returns Promise<void> - 删除操作不返回数据
   * 
   * 请求示例：
   * DELETE /users/1
   * 
   * 响应：无响应体，状态码 204
   * 
   * 异常处理：
   * - 400 Bad Request: ID 参数不是有效的整数
   * - 404 Not Found: 用户不存在
   * 
   * 注意：删除操作不可逆，请谨慎使用
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 设置响应状态码为 204
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}