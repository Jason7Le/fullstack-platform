import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// 应用入口函数：启动 Nest 应用与全局配置
async function bootstrap() {
  // 创建应用实例
  const app = await NestFactory.create(AppModule);
  // 读取配置服务实例
  const configService = app.get(ConfigService);
  // 读取应用端口，默认 3000
  const port = configService.get<number>('APP_PORT') || 3000;

  // Swagger 文档初始化
  const SwaggerConfig = new DocumentBuilder()
    .setTitle('User Service API') // 文档标题
    .setDescription('用户服务API文档') // 文档描述
    .setVersion('1.0') // 文档版本
    .addTag('users') // 标签分类
    .build();
  const SwaggerDocument = SwaggerModule.createDocument(app, SwaggerConfig);
  SwaggerModule.setup('apiSwaggerDoc', app, SwaggerDocument); // 文档访问路径 /apiSwaggerDoc

  // 获取 Reflector 用于角色守卫读取元数据
  const reflector = app.get(Reflector);

  // 全局验证管道：入参校验与自动类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 移除没有装饰器的属性
      forbidNonWhitelisted: true, // 禁止非白名单属性
    }),
  );

  // 全局守卫（也可在控制器级使用）：JWT 鉴权 + 角色权限
  app.useGlobalGuards(new JwtAuthGuard(), new RolesGuard(reflector));

  // 全局拦截器：统一响应结构
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器：兜底异常与 HTTP 异常处理
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 启动监听
  await app.listen(port);
}

// 启动应用
bootstrap();
