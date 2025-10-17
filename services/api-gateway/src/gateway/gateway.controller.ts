import { All, Controller, Next, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@ApiTags('Gateway')
@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All('api/users*')
  @ApiOperation({ summary: '代理用户服务请求' })
  async proxyUserService(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.gatewayService.proxyToUserService(req, res, next);
  }

  @All('api/auth*')
  @ApiOperation({ summary: '代理认证服务请求' })
  async proxyAuthService(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.gatewayService.proxyToUserService(req, res, next);
  }

  @All('api/analytics*')
  @ApiOperation({ summary: '代理分析服务请求' })
  async proxyAnalyticsService(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.gatewayService.proxyToUserService(req, res, next);
  }

  @All('api/rooms*')
  @ApiOperation({ summary: '代理房间服务请求' })
  async proxyRoomsService(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.gatewayService.proxyToUserService(req, res, next);
  }

  @All('api/notifications*')
  @ApiOperation({ summary: '代理通知服务请求' })
  async proxyNotificationsService(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.gatewayService.proxyToUserService(req, res, next);
  }

  @All('api/settings*')
  @ApiOperation({ summary: '代理设置服务请求' })
  async proxySettingsService(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.gatewayService.proxyToSettingsService(req, res, next);
  }
}
