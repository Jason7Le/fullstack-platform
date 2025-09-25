/**
 * 查询性能监控拦截器
 *
 * 功能说明：
 * - 监控所有数据库查询方法的执行时间
 * - 自动记录慢查询（超过1秒的查询）
 * - 记录查询成功/失败状态和耗时
 * - 提供详细的性能分析数据
 *
 * 工作原理：
 * 1. 在方法执行前记录开始时间
 * 2. 拦截方法执行过程
 * 3. 在方法执行后计算耗时并记录日志
 * 4. 捕获异常并记录错误信息
 *
 * 使用场景：
 * - 开发环境：实时监控查询性能
 * - 生产环境：识别性能瓶颈
 * - 调试：快速定位慢查询问题
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class QueryPerformanceInterceptor implements NestInterceptor {
  // 创建日志记录器，用于输出性能监控信息
  private readonly logger = new Logger(QueryPerformanceInterceptor.name);

  /**
   * 拦截器核心方法
   *
   * @param context - 执行上下文，包含请求信息、控制器、方法等
   * @param next - 下一个处理程序（通常是实际的业务方法）
   * @returns Observable<any> - 返回处理后的数据流
   *
   * 执行流程：
   * 1. 获取请求上下文信息
   * 2. 记录方法开始执行时间
   * 3. 调用下一个处理程序（业务方法）
   * 4. 监听执行结果并记录性能数据
   * 5. 处理异常情况
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 构建方法名称：控制器名.方法名
    // 例如：UsersController.findAll
    const methodName = `${context.getClass().name}.${context.getHandler().name}`;

    // 记录方法开始执行的时间戳
    const startTime = Date.now();

    // 调用下一个处理程序并返回Observable流
    return next.handle().pipe(
      // tap操作符：在数据流正常完成时执行，不影响数据流
      tap(() => {
        // 计算方法执行耗时
        const duration = Date.now() - startTime;

        // 记录成功执行的日志
        this.logger.log(`✅ ${methodName} 执行成功，耗时：${duration}ms`);

        // 检查是否为慢查询（超过1秒）
        if (duration > 1000) {
          this.logger.warn(
            `⚠️ 慢查询警告: ${methodName} 执行缓慢，耗时：${duration}ms`,
          );
        }

        // 可以根据需要添加更多性能分析
        if (duration > 5000) {
          this.logger.error(
            `🚨 严重性能问题: ${methodName} 耗时过长：${duration}ms`,
          );
        }
      }),

      // catchError操作符：捕获数据流中的错误
      catchError((error) => {
        // 计算到错误发生时的耗时
        const duration = Date.now() - startTime;

        // 记录错误日志，包含耗时信息
        this.logger.error(
          `❌ ${methodName} 执行失败，耗时：${duration}ms`,
          error.stack || error.message, // 记录错误堆栈或消息
        );

        // 重新抛出错误，确保错误处理链继续
        throw error;
      }),
    );
  }
}
