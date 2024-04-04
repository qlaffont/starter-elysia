export type ClassDecorator = <TFunction extends Function>(
  target: TFunction,
) => TFunction | void;

export type PropertyDecorator = (
  target: Object,
  propertyKey: string | symbol,
) => void;

export type MethodDecorator = <T>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;

export type ParameterDecorator = (
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number,
) => void;

/**
 * Enum for decorator type
 */
export enum DecoratorType {
  Class = 0,
  Parameter = 1,
  Property = 2,
  Method = 3,
  None = 4,
}

/**
 * Guesses which kind of decorator from its functional arguments
 * @param args
 * @returns {DecoratorType}
 */
export function getDecoratorTypeFromArguments(args: IArguments): DecoratorType {
  if (args.length === 0 || args.length > 3) {
    return DecoratorType.None;
  }

  const kind: string = typeof (args.length === 1 ? args[0] : args[2]);
  switch (kind) {
    case 'function':
      return DecoratorType.Class;
    case 'number':
      return DecoratorType.Parameter;
    case 'undefined':
      return DecoratorType.Property;
    case 'object':
      return DecoratorType.Method;
    default:
      return DecoratorType.None;
  }
}

/**
 * Guesses whether the given function is a class decorator
 * @param decorator
 * @param args
 * @returns {boolean}
 */
export function isClassDecorator(
  decorator: Function,
  args: IArguments,
): decorator is ClassDecorator {
  return getDecoratorTypeFromArguments(args) === DecoratorType.Class;
}

/**
 * Guesses whether the given function is a method parameter decorator
 * @param decorator
 * @param args
 * @returns {boolean}
 */
export function isParameterDecorator(
  decorator: Function,
  args: IArguments,
): decorator is ParameterDecorator {
  return getDecoratorTypeFromArguments(args) === DecoratorType.Parameter;
}

/**
 * Guesses whether the given function is a property decorator
 * @param decorator
 * @param args
 * @returns {boolean}
 */
export function isPropertyDecorator(
  decorator: Function,
  args: IArguments,
): decorator is PropertyDecorator {
  return getDecoratorTypeFromArguments(args) === DecoratorType.Property;
}

/**
 * Guesses whether the given function is a method decorator
 * @param decorator
 * @param args
 * @returns {boolean}
 */
export function isMethodDecorator(
  decorator: Function,
  args: IArguments,
): decorator is MethodDecorator {
  return getDecoratorTypeFromArguments(args) === DecoratorType.Method;
}

/**
 * Apply `decorator` on a class if `test` is true
 * @param test
 * @param decorator
 */
function Conditional(test: boolean, decorator: ClassDecorator): ClassDecorator;
/**
 * Apply `decorator` on a class if `test` function returns true
 * @param test function which receives a target class itself as an argument and returns boolean value
 * @param decorator
 */
function Conditional(
  test: (clazz?: Function) => boolean,
  decorator: ClassDecorator,
): ClassDecorator;

/**
 * Apply `decorator` on a property if `test` is true
 * @param test
 * @param decorator
 */
function Conditional(
  test: boolean,
  decorator: PropertyDecorator,
): PropertyDecorator;
/**
 * Apply `decorator` on a property if `test` function returns true
 * @param test function which receives a class' prototype and property name as arguments and returns boolean value
 * @param decorator
 */
function Conditional(
  test: (target?: Object, key?: string | symbol) => boolean,
  decorator: PropertyDecorator,
): PropertyDecorator;

/**
 * Apply `decorator` on a method parameter if `test` is true
 * @param test
 * @param decorator
 */
function Conditional(
  test: boolean,
  decorator: ParameterDecorator,
): ParameterDecorator;
/**
 * Apply `decorator` on a method parameter if `test` function returns true
 * @param test function which receives a class' prototype, property name and parameter position as arguments and returns boolean value
 * @param decorator
 */
function Conditional(
  test: (target?: Object, key?: string | symbol, index?: number) => boolean,
  decorator: ParameterDecorator,
): ParameterDecorator;

/**
 * Apply `decorator` on a method (which includes property accessor) if `test` is true
 * @param test
 * @param decorator
 */
function Conditional(
  test: boolean,
  decorator: MethodDecorator,
): MethodDecorator;
/**
 * Apply `decorator` on a method (which includes property accessor) if `test` function returns true
 * @param test function which receives a class' prototype, method name and property descriptor as arguments and returns boolean value
 * @param decorator
 */
function Conditional(
  test: (
    target?: Object,
    key?: string | symbol,
    desc?: PropertyDescriptor,
  ) => boolean,
  decorator: MethodDecorator,
): MethodDecorator;

function Conditional(test: any, decorator: Function): any {
  return (target: Object, key: string | symbol, value: any): any => {
    if (isClassDecorator(decorator, arguments)) {
      const clazz: Function = target as Function;
      const shouldDecorate: boolean =
        typeof test === 'function' ? test(clazz) : test;
      if (shouldDecorate && decorator) {
        return decorator(clazz);
      }
      return clazz;
    }
    if (isParameterDecorator(decorator, arguments)) {
      const index: number = value as number;
      const shouldDecorate: boolean =
        typeof test === 'function' ? test(target, key, index) : test;
      if (shouldDecorate && decorator) {
        decorator(target, key, index);
      }
    }
    if (isPropertyDecorator(decorator, arguments)) {
      const shouldDecorate: boolean =
        typeof test === 'function' ? test(target, key) : test;
      if (shouldDecorate && decorator) {
        decorator(target, key);
      }
    }
    if (isMethodDecorator(decorator, arguments)) {
      const desc: PropertyDescriptor = value as PropertyDescriptor;
      const shouldDecorate: boolean =
        typeof test === 'function' ? test(target, key, desc) : test;
      if (shouldDecorate && decorator) {
        return decorator(target, key, desc);
      }
      return desc;
    }
  };
}

export default Conditional;
