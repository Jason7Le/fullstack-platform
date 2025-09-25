/**
 * 用户服务类
 *
 * 提供用户相关的业务逻辑处理，包括：
 * - 用户创建、查询、更新、删除
 * - 密码加密和验证
 * - 用户统计信息
 * - 数据转换和响应格式化
 *
 * 使用 TypeORM 进行数据库操作，确保数据的一致性和安全性
 */
import {
  PasswordUtil,
  UserAlreadyExistsException,
  UserNotFoundException,
} from '@fullstack-platform/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { NotificationsService } from 'src/websocket/notifications.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

/*
 * 性能监控装饰器
 * 用于监控查询操作的性能
 * @param target - 目标对象
 * @param propertyName - 属性名称
 * @param descriptor - 属性描述符
 */
function QueryPerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const methodName = `${target.constructor.name}.${propertyName}`;

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - start;

      // 记录查询性能
      console.log(`✅ 查询成功: ${methodName} 耗时 ${duration}ms`);

      // 慢查询警告
      if (duration > 1000) {
        console.warn(`⚠️ 慢查询警告: ${methodName} 耗时 ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `❌ 查询失败: ${methodName} 耗时 ${duration}ms`,
        error.message,
      );
      throw error;
    }
  };
}

// 分页选项接口
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

// 分页结果接口
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
/*
 * 用户服务类
 * 实现用户管理的核心业务逻辑
 *
 * 职责：
 * - 用户数据的 CRUD 操作
 * - 密码安全处理
 * - 数据验证和业务规则检查
 * - 异常处理和错误响应
 */
@Injectable()
export class UsersService {
  /**
   * 构造函数
   * 注入 TypeORM 的 User 实体仓库，用于数据库操作
   *
   * @param usersRepository - User 实体的 TypeORM 仓库
   *   提供标准的数据库操作方法（find、save、remove 等）
   */
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // 注入用户仓库
    @Inject(forwardRef(() => NotificationsService)) // 注入通知服务
    private notificationsService: NotificationsService, // 注入通知服务
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // 注入缓存管理器
  ) {}

  /**
   * 将 User 实体转换为 UserResponseDto
   * 确保返回给前端的数据不包含敏感信息（如密码哈希）
   *
   * @param user - User 实体对象
   * @returns UserResponseDto - 转换后的响应 DTO
   *
   * 转换过程：
   * 1. 使用 instanceToPlain 将实体转换为普通对象
   * 2. 应用 class-transformer 的转换规则
   * 3. 创建 UserResponseDto 实例
   */
  private toResponseDto(user: User): UserResponseDto {
    const plainUser = instanceToPlain(user);
    return new UserResponseDto(plainUser);
  }

  /**
   * 创建新用户
   * 包含完整的用户创建流程：验证、检查重复、密码加密、数据保存
   *
   * @param createUserDto - 创建用户的数据传输对象
   * @returns Promise<UserResponseDto> - 返回创建成功的用户信息
   *
   * 业务逻辑：
   * 1. 验证密码强度是否符合要求
   * 2. 检查邮箱是否已被其他用户使用
   * 3. 对密码进行哈希加密
   * 4. 创建用户实体并保存到数据库
   * 5. 返回转换后的用户信息
   *
   * 异常处理：
   * - BadRequestException: 密码强度不符合要求
   * - ConflictException: 邮箱已被使用
   * - InternalServerErrorException: 其他系统错误
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // 验证密码强度：确保密码符合安全要求
      if (!PasswordUtil.validatePasswordStrength(createUserDto.password)) {
        throw new BadRequestException('密码必须至少6个字符，包含字母和数字');
      }

      // 检查邮箱唯一性：防止重复注册
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new UserAlreadyExistsException(createUserDto.email);
      }

      // 密码加密：将明文密码转换为安全的哈希值
      const passwordHash = await PasswordUtil.hashPassword(
        createUserDto.password,
      );

      // 创建用户实体：使用 TypeORM 的 create 方法
      const user = this.usersRepository.create({
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role || 'user', // 默认角色为 'user'
        passwordHash, // 存储加密后的密码哈希
      });

      // 保存用户到数据库
      const savedUser = await this.usersRepository.save(user);
      return this.toResponseDto(savedUser);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // 其他未知错误转换为系统错误
      throw new UserAlreadyExistsException('创建用户失败');
    }
  }

  /**
   * 获取所有用户列表
   * 按创建时间倒序排列，返回用户的基本信息
   *
   * @returns Promise<UserResponseDto[]> - 返回所有用户的响应 DTO 数组
   *
   * 业务逻辑：
   * 1. 查询数据库中的所有用户
   * 2. 按创建时间倒序排列（最新的在前）
   * 3. 将每个用户实体转换为响应 DTO
   * 4. 返回用户列表
   *
   * 注意：此方法返回所有用户，在生产环境中可能需要分页处理
   */
  @QueryPerformance // 性能监控装饰器
  async findAll(
    options?: PaginationOptions,
  ): Promise<PaginatedResult<UserResponseDto>> {
    try {
      // 使用分页、索引和查询优化
      const {
        page,
        limit,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
      } = options;
      // const users = await this.usersRepository.find({
      //   relations: [],
      //   order: { createdAt: 'DESC' }, // 按创建时间倒序排列
      // });
      // 构建查询构建器
      const queryBuilder = this.usersRepository
        .createQueryBuilder('user') // 指定查询的表
        .select([
          // 指定查询的字段
          'user.id',
          'user.email',
          'user.name',
          'user.role',
          'user.createdAt',
          'user.updatedAt',
        ]);
      // 添加搜索条件
      if (search) {
        queryBuilder.where(
          '(user.email LINK :search OR user.name LINK :search)',
          { search: `%${search}%` },
        );
      }
      // 添加排序
      queryBuilder.orderBy(`user.${sortBy}`, sortOrder); // 添加排序

      // 添加分页
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
      if (search) {
        queryBuilder.where('user.email LIKE :search', {
          search: `%${search}%`,
        });
      }

      // 执行查询
      const [users, total] = await queryBuilder.getManyAndCount();

      return {
        data: users.map((user) => this.toResponseDto(user)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // const users = await queryBuilder.getMany();
      // return users.map((user) => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException('获取用户列表失败');
    }
  }

  /**
   * 根据用户 ID 查找单个用户
   *
   * @param id - 用户唯一标识符
   * @returns Promise<UserResponseDto> - 返回找到的用户信息
   *
   * 业务逻辑：
   * 1. 根据 ID 查询用户
   * 2. 如果用户不存在，抛出 NotFoundException
   * 3. 将用户实体转换为响应 DTO
   * 4. 返回用户信息
   *
   * 异常处理：
   * - NotFoundException: 用户不存在
   * - InternalServerErrorException: 系统错误
   */
  @QueryPerformance // 性能监控装饰器
  async findOne(id: number): Promise<UserResponseDto> {
    try {
      // 带缓存的用户查询
      // 缓存用户信息，减少数据库查询
      // 尝试从缓存获取
      const cacheKey = `user: ${id}`;
      const cachedUser = await this.cacheManager.get<UserResponseDto>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      const user = await this.usersRepository.findOne({
        where: { id }, // 根据 ID 查询
        select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'], // 指定查询的字段
      });

      if (!user) {
        throw new UserNotFoundException(id);
      }

      const userResponse = this.toResponseDto(user);
      await this.cacheManager.set(cacheKey, userResponse, 300000); // 缓存5分钟
      return userResponse;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取用户信息失败');
    }
  }

  /**
   * 清除用户缓存
   * 在用户更新时清除相关缓存
   */
  async clearUserCache(id: number): Promise<void> {
    const cacheKey = `user: ${id}`;
    await this.cacheManager.del(cacheKey);
  }
  /**
   * 根据邮箱查找用户
   * 主要用于检查邮箱唯一性和用户登录验证
   *
   * @param email - 用户邮箱地址
   * @returns Promise<User | null> - 返回用户实体或 null
   *
   * 注意：此方法返回完整的 User 实体，包含密码哈希等敏感信息
   * 主要用于内部业务逻辑，不直接返回给前端
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { email }, // 根据邮箱查询
      });
    } catch (error) {
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  /**
   * 更新用户信息
   * 支持部分字段更新，包含邮箱唯一性检查和密码加密
   *
   * @param id - 用户唯一标识符
   * @param updateUserDto - 更新用户的数据传输对象
   * @returns Promise<UserResponseDto> - 返回更新后的用户信息
   *
   * 业务逻辑：
   * 1. 检查用户是否存在
   * 2. 如果更新邮箱，检查新邮箱是否被其他用户使用
   * 3. 更新用户信息（姓名、角色）
   * 4. 如果更新密码，验证强度并加密
   * 5. 保存更新后的用户信息
   *
   * 异常处理：
   * - NotFoundException: 用户不存在
   * - ConflictException: 邮箱冲突
   * - BadRequestException: 密码强度不符合要求
   * - InternalServerErrorException: 系统错误
   */
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      // 查找要更新的用户
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new UserNotFoundException(id);
      }

      // 邮箱唯一性检查：如果更新邮箱，确保不与其他用户冲突
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.findByEmail(updateUserDto.email);
        if (existingUser && existingUser.id !== id) {
          throw new UserAlreadyExistsException(updateUserDto.email);
        }
        user.email = updateUserDto.email;
      }

      // 更新基本信息：姓名和角色
      if (updateUserDto.name) user.name = updateUserDto.name;
      if (updateUserDto.role) user.role = updateUserDto.role;

      // 密码更新：如果提供了新密码，验证强度并加密
      if (updateUserDto.password) {
        if (!PasswordUtil.validatePasswordStrength(updateUserDto.password)) {
          throw new BadRequestException('密码必须至少6个字符，包含字母和数字');
        }
        user.passwordHash = await PasswordUtil.hashPassword(
          updateUserDto.password,
        );
      }

      // 保存更新后的用户信息
      const updatedUser = await this.usersRepository.save(user);

      // 更新用户通知
      this.notificationsService.sendUserNotification(updatedUser.id, {
        title: '用户信息更新',
        message: '用户信息更新成功',
        type: 'info',
        data: updatedUser,
      });
      // 清除用户缓存
      await this.clearUserCache(updatedUser.id);
      return this.toResponseDto(updatedUser);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户失败');
    }
  }

  /**
   * 删除用户
   * 根据用户 ID 删除用户记录
   *
   * @param id - 用户唯一标识符
   * @returns Promise<void> - 删除操作不返回数据
   *
   * 业务逻辑：
   * 1. 检查用户是否存在
   * 2. 如果存在，从数据库中删除用户记录
   * 3. 如果不存在，抛出 NotFoundException
   *
   * 异常处理：
   * - NotFoundException: 用户不存在
   * - InternalServerErrorException: 系统错误
   */
  async remove(id: number): Promise<void> {
    try {
      // 查找要删除的用户
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new UserNotFoundException(id);
      }

      // 从数据库中删除用户
      await this.usersRepository.remove(user);
      // 清除用户缓存
      await this.clearUserCache(id);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('删除用户失败');
    }
  }

  // 按角色批量查询用户
  async findByRoles(roles: string[]): Promise<UserResponseDto[]> {
    try {
      const users = await this.usersRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.email',
          'user.name',
          'user.role',
          'user.createdAt',
          'user.updatedAt',
        ]) // 指定查询的字段
        .where('user.role IN (:...roles)', { roles }) // 按角色查询
        .orderBy('user.createdAt', 'DESC') // 按创建时间倒序排列
        .getMany(); // 获取所有用户
      return users.map((user) => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException('按角色查询用户失败');
    }
  }
  /**
   * 获取用户统计信息
   * 返回用户总数和按角色分组的用户数量
   *
   * @returns Promise<{ total: number; byRole: Record<string, number> }> - 返回统计信息
   *
   * 业务逻辑：
   * 1. 统计用户总数
   * 2. 按角色分组统计用户数量
   * 3. 返回统计结果
   *
   * 返回格式：
   * {
   *   total: 100,           // 用户总数
   *   byRole: {             // 按角色分组
   *     'admin': 5,         // 管理员数量
   *     'user': 90,        // 普通用户数量
   *     'guest': 5         // 访客数量
   *   }
   * }
   */
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
  }> {
    try {
      // 使用原生SQL查询，效率更高
      const statsQuery = `
      SELECT COUNT(*) as total,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
      COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
      COUNT(CASE WHEN role = 'guest' THEN 1 END) as guest_count,
      COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent_count
      FROM users;
      `;

      const result = await this.usersRepository.query(statsQuery);
      const stats = result[0];
      return {
        total: parseInt(stats.total),
        byRole: {
          admin: parseInt(stats.admin_count),
          user: parseInt(stats.user_count),
          guest: parseInt(stats.guest_count),
        },
        recentUsers: parseInt(stats.recent_users),
      };

      // 统计用户总数
      // const total = await this.usersRepository.count();

      // // 按角色分组统计用户数量
      // const usersByRole = await this.usersRepository
      //   .createQueryBuilder('user')
      //   .select('user.role', 'role')
      //   .addSelect('COUNT(user.id)', 'count')
      //   .groupBy('user.role')
      //   .getRawMany();

      // // 将查询结果转换为对象格式
      // const byRole = {};
      // usersByRole.forEach((item) => {
      //   byRole[item.role] = parseInt(item.count);
      // });

      // return { total, byRole };
    } catch (error) {
      throw new InternalServerErrorException('获取用户统计失败');
    }
  }

  /**
   * 更新刷新令牌
   * 保存新的令牌和过期时间
   * @param id - 用户ID
   * @param refreshToken - 刷新令牌
   * @param refreshTokenExpiry - 刷新令牌过期时间
   */
  async updateRefreshToken(
    userId: number,
    refreshToken: string,
    refreshTokenExpiry: Date,
  ): Promise<void> {
    try {
      await this.usersRepository.update(userId, {
        refreshToken,
        refreshTokenExpiry,
      });
    } catch (error) {
      throw new InternalServerErrorException('更新刷新令牌失败');
    }
  }

  /**
   * 根据刷新令牌查找用户
   * 用于验证刷新令牌的有效性
   * @param refreshToken - 刷新令牌
   * @returns Promise<User | null> - 返回用户实体或 null
   */
  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { refreshToken }, // 根据刷新令牌查询
      });
    } catch (error) {
      throw new InternalServerErrorException('查询用户失败');
    }
  }
}
