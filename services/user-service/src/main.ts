import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ErrorMonitoringService,
  ErrorTrackingInterceptor,
  GlobalExceptionFilter,
  MonitoringService,
  PerformanceInterceptor,
} from '@platform/monitoring';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
// 应用入口函数：启动 Nest 应用与全局配置
async function bootstrap() {
  // 创建应用实例
  const app = await NestFactory.create(AppModule);
  // 读取配置服务实例
  const configService = app.get(ConfigService);
  // 读取应用端口，默认 3001
  const port = configService.get<number>('APP_PORT') || 3001;
  // Swagger 文档初始化
  const SwaggerConfig = new DocumentBuilder()
    .setTitle('用户服务 API') // 文档标题
    .setDescription('用户管理服务API文档，包含用户CRUD操作和认证功能') // 文档描述
    .setVersion('1.0') // 文档版本
    .addTag('用户管理', '用户CRUD操作相关接口')
    .addTag('认证管理', '用户登录注册相关接口')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入JWT token',
        in: 'header',
      },
      'JWT-auth', // 这个名称要与@ApiBearerAuth()中的名称一致
    )
    .build();
  const SwaggerDocument = SwaggerModule.createDocument(app, SwaggerConfig);
  SwaggerModule.setup('api/docs/apiSwaggerDoc', app, SwaggerDocument); // 文档访问路径 /apiSwaggerDoc

  // 获取 Reflector 用于角色守卫读取元数据（暂时注释，因为未使用全局守卫）
  // const reflector = app.get(Reflector);

  // 全局验证管道：入参校验与自动类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 移除没有装饰器的属性
      forbidNonWhitelisted: true, // 禁止非白名单属性
    }),
  );

  // 全局守卫（也可在控制器级使用）：JWT 鉴权 + 角色权限
  // 注意：这里不设置全局JWT守卫，而是在需要保护的控制器上单独设置
  // app.useGlobalGuards(new JwtAuthGuard(), new RolesGuard(reflector));

  // 全局拦截器：统一响应结构 + 性能监控 + 错误追踪
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new PerformanceInterceptor(app.get(MonitoringService)),
    new ErrorTrackingInterceptor(app.get(ErrorMonitoringService)),
  );

  // 全局异常过滤器：使用统一监控的异常过滤器
  app.useGlobalFilters(
    new GlobalExceptionFilter(app.get(ErrorMonitoringService)),
  );

  console.log('=== 服务启动信息 ===');
  console.log('环境变量验证:');
  console.log('----DB_HOST:', process.env.DB_HOST);
  console.log('----DB_PORT:', process.env.DB_PORT);
  console.log('----DB_USERNAME:', process.env.DB_USERNAME);
  console.log('----DB_DATABASE:', process.env.DB_DATABASE);
  console.log('----NODE_ENV:', process.env.NODE_ENV);
  console.log('=== 服务启动完成 ===');
  // 启用 CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
    ], // 允许 API 网关、前端和开发服务器访问
    credentials: true, // 允许携带凭证(如cookie)
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], // 允许的请求方法
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // 允许的请求头
  });

  // 添加指标端点
  app.use('/metrics', async (req, res) => {
    const monitoringService = app.get(MonitoringService);
    const metrics = await monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  });

  // 启动监听
  await app.listen(port);
}

// 启动应用
bootstrap().catch((error) => {
  console.error('应用启动失败:', error);
  process.exit(1);
});
