import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SettingsModule } from './settings.module';

/**
 * 系统设置服务启动函数
 * 配置并启动 NestJS 应用程序
 *
 * @description
 * - 配置全局验证管道
 * - 配置 CORS 跨域支持
 * - 配置 Swagger API 文档
 * - 启动 HTTP 服务器
 */
async function bootstrap() {
  const app = await NestFactory.create(SettingsModule);

  // 全局验证管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 过滤未定义的属性
      forbidNonWhitelisted: true, // 禁止未定义的属性
    }),
  );

  // CORS 跨域配置
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true, // 允许携带凭证
  });

  // Swagger API 文档配置
  const config = new DocumentBuilder()
    .setTitle('系统设置服务 API')
    .setDescription('系统设置服务的 API 文档')
    .setVersion('1.0')
    .addTag('Settings')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 启动服务器
  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🚀 系统设置服务已启动: http://localhost:${port}`);
  console.log(`📚 API 文档: http://localhost:${port}/api`);
}

bootstrap();
