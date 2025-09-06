import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 添加这行
  ],
  controllers: [UsersController],
  providers: [UsersService, Reflector],
  exports: [UsersService, TypeOrmModule], // 导出以便其他模块使用
})
export class UsersModule {}
