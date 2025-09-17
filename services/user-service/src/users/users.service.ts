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

/**
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
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
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
  async findAll(): Promise<UserResponseDto[]> {
    try {
      const users = await this.usersRepository.find({
        order: { createdAt: 'DESC' }, // 按创建时间倒序排列
      });
      return users.map((user) => this.toResponseDto(user));
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
  async findOne(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id }, // 根据 ID 查询
      });

      if (!user) {
        throw new UserNotFoundException(id);
      }

      return this.toResponseDto(user);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取用户信息失败');
    }
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
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('删除用户失败');
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
      // 统计用户总数
      const total = await this.usersRepository.count();

      // 按角色分组统计用户数量
      const usersByRole = await this.usersRepository
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(user.id)', 'count')
        .groupBy('user.role')
        .getRawMany();

      // 将查询结果转换为对象格式
      const byRole = {};
      usersByRole.forEach((item) => {
        byRole[item.role] = parseInt(item.count);
      });

      return { total, byRole };
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
