import { Module, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebSocketModule } from '../websocket/websocket.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 添加这行
    forwardRef(() => WebSocketModule), // 使用 forwardRef 解决循环依赖
  ],
  controllers: [UsersController],
  providers: [UsersService, Reflector],
  exports: [UsersService, TypeOrmModule], // 导出以便其他模块使用
})
export class UsersModule {}
