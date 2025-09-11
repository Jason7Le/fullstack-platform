// Nest 核心：模块装饰器，用于定义和组织 Nest 模块
import { Module } from '@nestjs/common';
// TypeORM 集成模块：提供与 TypeORM 的集成（数据库连接、仓库注入等）
import { TypeOrmModule } from '@nestjs/typeorm';
// 配置模块与服务：加载环境变量、读取配置（ConfigService 用于获取配置项）
import { ConfigModule, ConfigService } from '@nestjs/config';
// 事件发射器模块：用于模块间事件通信
import { EventEmitterModule } from '@nestjs/event-emitter';
// 应用控制器：处理路由与请求
import { AppController } from './app.controller';
// 应用服务：封装业务逻辑，可被控制器注入调用
import { AppService } from './app.service';
// 用户实体：TypeORM 实体类，映射数据库中的 users 表
import { User } from 'users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { WebSocketModule } from './websocket/websocket.module';

import * as path from 'path';

@Module({
  // imports: 声明当前模块依赖的其它模块
  imports: [
    // 配置模块：
    // - isGlobal: true 使 ConfigModule 全局可用（无需在其它模块重复导入）
    // - envFilePath: 指定要按顺序解析的环境变量文件路径数组
    //   说明：当数组中多个文件存在相同变量名时，“靠后”文件会覆盖“靠前”文件（后者优先生效）。
    //   常见用法：先加载仓库根的通用变量，再加载当前服务目录下的本地覆盖变量；示例文件（.env.example）仅作为占位与文档，便于本地首次复制使用。
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      envFilePath: [
        // 1) 仓库根目录的 .env（全局默认）
        path.join(process.cwd(), '..', '..', '.env'),
        // 2) 当前服务目录下的 .env（对全局进行本地覆盖）
        path.join(process.cwd(), '.env'),
        // 3) 仓库根目录的示例变量文件（仅作为兜底与文档，不建议提交敏感值）
        path.join(process.cwd(), '..', '..', '.env.example'),
        // 4) 服务目录的示例变量文件
        path.join(process.cwd(), '.env.example'),
      ],
      // load: 通过函数返回“编程式默认配置”，会与 env 文件及进程环境变量合并。
      // 优先级（高 -> 低）：进程环境变量 > envFilePath 解析结果（后者覆盖前者）> 这里的默认值。
      // 典型用途：提供服务级别的默认项，便于在未设置环境变量时仍能运行；线上通过环境变量覆盖。
      load: [
        () => ({
          // 服务名称（默认值，可被 .env 或进程环境覆盖）
          SERVICE_NAME: 'user-service',
          // 服务版本（默认值）
          SERVICE_VERSION: '1.0.0',
        }),
      ],
    }),

    // TypeORM 模块（异步方式注入配置）：
    // - imports: 声明依赖的模块（此处为了可以使用 ConfigService）
    // - useFactory: 工厂函数，基于 ConfigService 生成 TypeORM 配置对象
    // - inject: 指定注入到工厂函数的依赖（ConfigService）
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // 数据库类型：此处使用 MySQL
        type: 'mysql',
        // 数据库主机名/IP
        host: configService.get<string>('DB_HOST'),
        // 数据库端口号
        port: configService.get<number>('DB_PORT'),
        // 数据库用户名
        username: configService.get<string>('DB_USERNAME'),
        // 数据库密码
        password: configService.get<string>('DB_PASSWORD'),
        // 目标数据库名称
        database: configService.get<string>('DB_DATABASE'),
        // 显式声明的实体类（与 autoLoadEntities 可二选一；二者并存时两者都会生效）
        entities: [User],
        // 是否自动同步实体到数据库结构（仅建议在开发环境开启）
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
        // 是否打印 SQL 日志：在非生产环境开启
        logging: process.env.NODE_ENV !== 'production',
        // 自动加载通过 TypeOrmModule.forFeature 注册的实体
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(), // 事件发射器模块
    CommonModule, // 全局通用模块
    UsersModule,
    AuthModule,
    RoomsModule, // 房间管理模块
    WebSocketModule, // WebSocket 模块
    NotificationsModule, // 通知模块
    // 其他模块可以继续在此添加
  ],
  // controllers: 当前模块暴露的控制器列表
  controllers: [AppController],
  // providers: 当前模块提供的服务（可注入）的列表
  providers: [AppService],
})
export class AppModule {}
