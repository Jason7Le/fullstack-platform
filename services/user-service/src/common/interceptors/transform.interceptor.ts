import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

/**
 * 数据转换拦截器
 * 统一处理响应数据的格式转换，包括日期格式化和嵌套对象处理
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  /**
   * 拦截响应数据并进行转换
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 处理空数据
        if (data === null || data === undefined) {
          return data;
        }

        // 如果是数组，转换每个元素
        if (Array.isArray(data)) {
          return data.map((item) => this.transformItem(item));
        }

        // 如果是分页数据
        if (data && data.data && Array.isArray(data.data)) {
          return {
            ...data,
            data: data.data.map((item: any) => this.transformItem(item)),
          };
        }

        // 转换单个对象
        return this.transformItem(data);
      }),
    );
  }

  /**
   * 转换单个数据项
   * @param item 待转换的数据项
   * @returns 转换后的数据项
   */
  private transformItem(item: any): any {
    if (item instanceof Object) {
      // 如果是 Date 对象，转换为 ISO 字符串
      if (item instanceof Date) {
        return item.toISOString();
      }

      // 使用 class-transformer 转换
      const transformed = instanceToPlain(item);

      // 处理嵌套对象
      Object.keys(transformed).forEach((key) => {
        if (
          transformed[key] instanceof Object &&
          !(transformed[key] instanceof Date)
        ) {
          transformed[key] = this.transformItem(transformed[key]);
        }
      });

      return transformed;
    }

    return item;
  }
}
