import { Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class GatewayService {
  private userServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api', // 保持路径不变
    },
    onError: (err, req, res) => {
      console.error('用户服务代理错误:', err.message);
      res.status(500).json({
        success: false,
        message: '用户服务暂时不可用',
        error: err.message,
      });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[${new Date().toISOString()}] 代理请求: ${req.method} ${req.url} -> 用户服务`);
    },
  });

  private settingsServiceProxy = createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api', // 保持路径不变
    },
    onError: (err, req, res) => {
      console.error('设置服务代理错误:', err.message);
      res.status(500).json({
        success: false,
        message: '设置服务暂时不可用',
        error: err.message,
      });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[${new Date().toISOString()}] 代理请求: ${req.method} ${req.url} -> 设置服务`);
    },
  });

  async proxyToUserService(req: Request, res: Response, next: NextFunction) {
    return this.userServiceProxy(req, res, next);
  }

  async proxyToSettingsService(req: Request, res: Response, next: NextFunction) {
    return this.settingsServiceProxy(req, res, next);
  }
}
