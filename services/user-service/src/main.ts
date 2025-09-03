import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3000;
  // console.log(`Application is running on: http://localhost:${port}`);
  // console.log(`Environment: ${configService.get('NODE_ENV')}`);
  // console.log(`Database: ${configService.get('DB_DATABASE')}`);
  // Swagger 配置
  const SwaggerConfig = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('用户服务API文档')
    .setVersion('1.0')
    .addTag('users')
    .build();
  const SwaggerDocument = SwaggerModule.createDocument(app, SwaggerConfig);
  SwaggerModule.setup('api', app, SwaggerDocument);
  // 添加全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 自动转换类型
    whitelist: true, // 移除没有装饰器的属性
    forbidNonWhitelisted: true, // 禁止非白名单属性
  }))

  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  await app.listen(port);

}
bootstrap();
