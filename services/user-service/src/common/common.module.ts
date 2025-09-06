import { Module, Global } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 通用模块
 * 提供全局可用的通用组件
 *
 * 使用 @Global() 装饰器使此模块全局可用，
 * 这样其他模块就可以直接使用这里提供的组件，
 * 无需在每个模块中重复导入
 */
@Global()
@Module({
  providers: [Reflector], // 提供Reflector服务
  exports: [Reflector], // 导出Reflector供其他模块使用
})
export class CommonModule {}
