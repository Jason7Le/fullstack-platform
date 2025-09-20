import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 配置
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3003'],
    credentials: true,
  });

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('微服务 API 网关')
    .setVersion('1.0')
    .addTag('gateway')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 启动服务
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API Gateway 启动成功: http://localhost:${port}`);
  console.log(`📚 API 文档: http://localhost:${port}/api/docs`);
}

bootstrap();
