import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SettingsEntity } from './entities/settings.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * 系统设置模块
 * 配置系统设置服务的依赖和模块
 *
 * @description
 * - 配置环境变量加载
 * - 配置数据库连接
 * - 注册设置实体、控制器和服务
 * - 提供全局配置服务
 */
@Module({
  imports: [
    // 全局配置模块，支持多环境配置文件
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), '..', '..', '.env'), // 项目根目录
        path.join(process.cwd(), '.env'), // 当前服务目录
        path.join(process.cwd(), '..', '..', '.env.example'), // 项目根目录示例
        path.join(process.cwd(), '.env.example'), // 当前服务目录示例
      ],
      load: [
        () => ({
          SERVICE_NAME: 'settings-service',
          SERVICE_VERSION: '1.0.0',
        }),
      ],
    }),
    // 数据库连接配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [SettingsEntity],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
        logging: process.env.NODE_ENV !== 'production',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    // 注册设置实体
    TypeOrmModule.forFeature([SettingsEntity]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
