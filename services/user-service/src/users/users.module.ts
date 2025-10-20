import { CacheModule } from '@nestjs/cache-manager';
import { Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebSocketModule } from '../websocket/websocket.module';
import { User } from './entities/user.entity';
import { QueryPerformanceInterceptor } from './interceptors/query-performance.interceptor';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 添加这行
    CacheModule.register(), // 添加缓存模块
    forwardRef(() => WebSocketModule), // 使用 forwardRef 解决循环依赖
  ],
  controllers: [UsersController],
  providers: [
    UsersService, // 用户服务
    Reflector, // 反射器
    {
      provide: APP_INTERCEPTOR, // 使用 APP_INTERCEPTOR 注册拦截器
      useClass: QueryPerformanceInterceptor, // 使用 QueryPerformanceInterceptor 拦截器
    },
  ],
  exports: [UsersService, TypeOrmModule], // 导出以便其他模块使用
})
export class UsersModule {}
