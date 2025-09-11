import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller('api/rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * 创建房间
   */
  @Post('createRoom')
  async createRoom(@Request() req: any, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log('RoomsController: 接收到的创建房间请求:', {
      createRoomDto,
      userId,
      userEmail,
    });

    return await this.roomsService.createRoom({
      ...createRoomDto,
      ownerId: userId,
      ownerEmail: userEmail,
    });
  }

  /**
   * 获取房间列表
   */
  @Get('getRoomList')
  async getRoomList() {
    return await this.roomsService.getRoomList();
  }

  /**
   * 调试接口：直接查询数据库
   */
  @Get('debug/rooms')
  async debugRooms() {
    return await this.roomsService.debugRooms();
  }

  /**
   * 获取房间详情
   */
  @Get('getRoomInfo/:id')
  async getRoomById(@Param('id') id: string) {
    return await this.roomsService.getRoomById(id);
  }

  /**
   * 删除房间
   */
  @Delete('deleteRoom/:id')
  async deleteRoom(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return await this.roomsService.deleteRoom(id, userId);
  }
}
