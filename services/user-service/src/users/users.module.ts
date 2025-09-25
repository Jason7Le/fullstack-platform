import { Module, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebSocketModule } from '../websocket/websocket.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { QueryPerformanceInterceptor } from './interceptors/query-performance.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 添加这行
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
