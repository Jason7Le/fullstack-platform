declare module 'class-transformer' {
  export function instanceToPlain(object: any, options?: any): any;
  export function Expose(): PropertyDecorator;
  export function Exclude(): PropertyDecorator;
  export function Transform(
    transformFn: (value: any) => any,
  ): PropertyDecorator;
  export function Type(typeFunction?: () => any): PropertyDecorator;
  export function TransformClassToPlain(params?: any): MethodDecorator;
  export function TransformPlainToClass(
    classType: any,
    object: any,
    options?: any,
  ): any;
}
