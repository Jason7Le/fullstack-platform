import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomMember } from './entities/room-member.entity';
import { Room } from './entities/room.entity';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomMember]), // 注册实体
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService], // 导出服务供其他模块使用
})
export class RoomsModule {}
