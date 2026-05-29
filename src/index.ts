type IsUnknown<T> = unknown extends T ? ([T] extends [unknown] ? true : false) : false
type NormalizeUnknownToUndefined<T> = IsUnknown<T> extends true ? undefined : T
type IsOnlyUndefined<T> = [Exclude<T, undefined>] extends [never] ? true : false
type InferFirstArg<TFn> = TFn extends (...args: infer TArgs) => unknown
  ? TArgs extends [infer TFirst, ...unknown[]]
    ? TFirst
    : undefined
  : undefined
type InferPluginPropInput<TProp extends ErrorPluginPropOptions<any, any, any, any>> = TProp extends {
  init: infer TInit
}
  ? NormalizeUnknownToUndefined<InferFirstArg<TInit>>
  : undefined
type ErrorPluginPropInit<TInputValue, TOutputValue> = ((input: TInputValue) => TOutputValue) | (() => TOutputValue)
type ErrorPluginPropSerializeOptions<
  TOutputValue,
  TError extends Error0,
  TResolveValue extends TOutputValue | undefined,
> = {
  own: TOutputValue | undefined
  flow: Array<TOutputValue | undefined>
  resolved: TResolveValue
  error: TError
  isPublic: boolean
}
type ErrorPluginPropSerialize<TOutputValue, TError extends Error0, TResolveValue extends TOutputValue | undefined> =
  | ((options: ErrorPluginPropSerializeOptions<TOutputValue, TError, TResolveValue>) => unknown)
  | false
type ErrorPluginPropDeserialize<TOutputValue> =
  | ((options: { value: unknown; record: Record<string, unknown> }) => TOutputValue | undefined)
  | false
type ErrorPluginPropOptionsResolveOptions<TOutputValue, TError extends Error0> = {
  own: TOutputValue | undefined
  flow: Array<TOutputValue | undefined>
  error: TError
}
type ErrorPluginPropOptionsBase<TOutputValue, TError extends Error0, TResolveValue extends TOutputValue | undefined> = {
  resolve: (options: ErrorPluginPropOptionsResolveOptions<TOutputValue, TError>) => TResolveValue
  serialize: ErrorPluginPropSerialize<TOutputValue, TError, TResolveValue>
  deserialize: ErrorPluginPropDeserialize<TOutputValue>
}
type ErrorPluginPropOptionsWithInit<
  TInputValue,
  TOutputValue,
  TError extends Error0,
  TResolveValue extends TOutputValue | undefined,
> = ErrorPluginPropOptionsBase<TOutputValue, TError, TResolveValue> & {
  init: ErrorPluginPropInit<TInputValue, TOutputValue>
}
type ErrorPluginPropOptionsWithoutInit<
  TOutputValue,
  TError extends Error0,
  TResolveValue extends TOutputValue | undefined,
> = ErrorPluginPropOptionsBase<TOutputValue, TError, TResolveValue> & {
  init?: undefined
}
type ErrorPluginPropOptions<
  TInputValue = undefined,
  TOutputValue = unknown,
  TError extends Error0 = Error0,
  TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
> =
  | ErrorPluginPropOptionsWithInit<TInputValue, TOutputValue, TError, TResolveValue>
  | ErrorPluginPropOptionsWithoutInit<TOutputValue, TError, TResolveValue>

type ErrorPluginPropOptionsBaseDefinition<
  TOutputValue,
  TError extends Error0,
  TResolveValue extends TOutputValue | undefined,
> = {
  resolve?: ((options: ErrorPluginPropOptionsResolveOptions<TOutputValue, TError>) => TResolveValue) | boolean
  serialize?: ErrorPluginPropSerialize<TOutputValue, TError, TResolveValue>
  deserialize?: ErrorPluginPropDeserialize<TOutputValue>
}
type ErrorPluginPropOptionsWithInitDefinition<
  TInputValue,
  TOutputValue,
  TError extends Error0,
  TResolveValue extends TOutputValue | undefined,
> = ErrorPluginPropOptionsBaseDefinition<TOutputValue, TError, TResolveValue> & {
  init: ErrorPluginPropInit<TInputValue, TOutputValue>
}
type ErrorPluginPropOptionsWithoutInitDefinition<
  TOutputValue,
  TError extends Error0,
  TResolveValue extends TOutputValue | undefined,
> = ErrorPluginPropOptionsBaseDefinition<TOutputValue, TError, TResolveValue> & {
  init?: undefined
}
type ErrorPluginPropOptionsDefinition<
  TInputValue = undefined,
  TOutputValue = unknown,
  TError extends Error0 = Error0,
  TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
> =
  | ErrorPluginPropOptionsWithInitDefinition<TInputValue, TOutputValue, TError, TResolveValue>
  | ErrorPluginPropOptionsWithoutInitDefinition<TOutputValue, TError, TResolveValue>

type ErrorPluginMethodFn<TOutputValue, TArgs extends unknown[] = unknown[], TError extends Error0 = Error0> = (
  error: TError,
  ...args: TArgs
) => TOutputValue
type ErrorPluginAnyMethodFn = (error: any, ...args: any[]) => any
type ErrorPluginAdaptResult<TOutputProps extends Record<string, unknown>> = Partial<TOutputProps> | undefined
type ErrorPluginAdaptFn<
  TError extends Error0 = Error0,
  TOutputProps extends Record<string, unknown> = Record<never, never>,
> = ((error: TError) => void) | ((error: TError) => ErrorPluginAdaptResult<TOutputProps>)
type ErrorPluginStackSerialize<TError extends Error0> = (options: {
  value: string | undefined
  error: TError
  isPublic: boolean
}) => unknown
type ErrorPluginStack<TError extends Error0 = Error0> = { serialize: ErrorPluginStackSerialize<TError> }
type ErrorPluginCauseSerialize<TError extends Error0> = (options: {
  cause: unknown
  error: TError
  isPublic: boolean
  is: (cause: unknown) => boolean
  serialize: (cause: unknown) => Record<string, unknown>
}) => unknown
type ErrorPluginCauseDeserialize = (options: {
  cause: unknown
  error: Record<string, unknown>
  isSerialized: (serializedCause: unknown) => boolean
  fromSerialized: (serializedCause: unknown) => Error0
}) => unknown
type ErrorPluginCause<TError extends Error0 = Error0> = {
  serialize: ErrorPluginCauseSerialize<TError>
  deserialize: ErrorPluginCauseDeserialize
}
type ErrorPluginMessageSerialize<TError extends Error0> = (options: {
  value: string
  error: TError
  isPublic: boolean
}) => unknown
type ErrorPluginMessage<TError extends Error0 = Error0> = { serialize: ErrorPluginMessageSerialize<TError> }
type ErrorMethodRecord = { fn: ErrorPluginAnyMethodFn }

type ErrorPluginProps = { [key: string]: ErrorPluginPropOptions<any, any> }
type ErrorPluginMethods = { [key: string]: ErrorPluginAnyMethodFn }

export type ErrorPlugin<
  TProps extends ErrorPluginProps = Record<never, never>,
  TMethods extends ErrorPluginMethods = Record<never, never>,
> = {
  props?: TProps
  methods?: TMethods
  adapt?: Array<ErrorPluginAdaptFn<Error0, PluginOutputProps<TProps>>>
  stack?: ErrorPluginStack
  cause?: ErrorPluginCause
  message?: ErrorPluginMessage
}
type AddPropToPluginProps<
  TProps extends ErrorPluginProps,
  TKey extends string,
  TInputValue,
  TOutputValue,
  TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
> = TProps & Record<TKey, ErrorPluginPropOptions<TInputValue, TOutputValue, Error0, TResolveValue>>
type AddMethodToPluginMethods<
  TMethods extends ErrorPluginMethods,
  TKey extends string,
  TMethod extends ErrorPluginAnyMethodFn,
> = TMethods & Record<TKey, TMethod>
type PluginOutputProps<TProps extends ErrorPluginProps> = {
  [TKey in keyof TProps]: TProps[TKey] extends ErrorPluginPropOptions<any, any, any, infer TResolveValue>
    ? TResolveValue
    : never
}
type ErrorPluginsMap = {
  props: Record<string, { init: unknown; output: unknown; resolve: unknown }>
  methods: Record<string, ErrorMethodRecord>
}
type IsEmptyObject<T> = keyof T extends never ? true : false
type ErrorInputBase = {
  cause?: unknown
}
type ErrorInputPluginProps<TPluginsMap extends ErrorPluginsMap> = {
  [TKey in keyof TPluginsMap['props'] as IsOnlyUndefined<TPluginsMap['props'][TKey]['init']> extends true
    ? never
    : TKey]?: TPluginsMap['props'][TKey]['init']
}
type ErrorInput<TPluginsMap extends ErrorPluginsMap> =
  IsEmptyObject<TPluginsMap['props']> extends true
    ? ErrorInputBase
    : ErrorInputBase & ErrorInputPluginProps<TPluginsMap>

type ErrorResolvedProps<TPluginsMap extends ErrorPluginsMap> = {
  [TKey in keyof TPluginsMap['props']]: TPluginsMap['props'][TKey]['resolve']
}
type ErrorOwnProps<TPluginsMap extends ErrorPluginsMap> = {
  [TKey in keyof TPluginsMap['props']]: TPluginsMap['props'][TKey]['output'] | undefined
}
type ErrorResolveMethods<TPluginsMap extends ErrorPluginsMap> = {
  resolve: () => ErrorResolvedProps<TPluginsMap>
}
type Error0ResolvedInstance<TPluginsMap extends ErrorPluginsMap> = Error0 &
  ErrorResolved<TPluginsMap> &
  ErrorResolveMethods<TPluginsMap>
type ErrorOwnMethods<TPluginsMap extends ErrorPluginsMap> = {
  own?: Partial<ErrorOwnProps<TPluginsMap>>
  flow: <TKey extends keyof TPluginsMap['props'] & string>(key: TKey) => Array<ErrorOwnProps<TPluginsMap>[TKey]>
  assign: (props: Partial<ErrorOwnProps<TPluginsMap>>) => Error0ResolvedInstance<TPluginsMap>
}
export type InstanceError0<TPluginsMap extends ErrorPluginsMap> = Error0ResolvedInstance<TPluginsMap> &
  ErrorOwnMethods<TPluginsMap> & { readonly __pluginsMap?: TPluginsMap }
// type BindInstanceMethod<TMethod> = TMethod extends {
//   (error: any, ...args: infer TArgs1): infer TOutput1
//   (error: any, ...args: infer TArgs2): infer TOutput2
//   (error: any, ...args: infer TArgs3): infer TOutput3
//   (error: any, ...args: infer TArgs4): infer TOutput4
// }
//   ? {
//       (...args: TArgs1): TOutput1
//       (...args: TArgs2): TOutput2
//       (...args: TArgs3): TOutput3
//       (...args: TArgs4): TOutput4
//     }
//   : TMethod extends {
//         (error: any, ...args: infer TArgs1): infer TOutput1
//         (error: any, ...args: infer TArgs2): infer TOutput2
//         (error: any, ...args: infer TArgs3): infer TOutput3
//       }
//     ? {
//         (...args: TArgs1): TOutput1
//         (...args: TArgs2): TOutput2
//         (...args: TArgs3): TOutput3
//       }
//     : TMethod extends {
//           (error: any, ...args: infer TArgs1): infer TOutput1
//           (error: any, ...args: infer TArgs2): infer TOutput2
//         }
//       ? {
//           (...args: TArgs1): TOutput1
//           (...args: TArgs2): TOutput2
//         }
//       : TMethod extends (error: any, ...args: infer TArgs) => infer TOutput
//         ? (...args: TArgs) => TOutput
//         : never
// type BindStaticMethod<TMethod> = TMethod extends {
//   (error: any, ...args: infer TArgs1): infer TOutput1
//   (error: any, ...args: infer TArgs2): infer TOutput2
//   (error: any, ...args: infer TArgs3): infer TOutput3
//   (error: any, ...args: infer TArgs4): infer TOutput4
// }
//   ? {
//       (error: unknown, ...args: TArgs1): TOutput1
//       (error: unknown, ...args: TArgs2): TOutput2
//       (error: unknown, ...args: TArgs3): TOutput3
//       (error: unknown, ...args: TArgs4): TOutput4
//     }
//   : TMethod extends {
//         (error: any, ...args: infer TArgs1): infer TOutput1
//         (error: any, ...args: infer TArgs2): infer TOutput2
//         (error: any, ...args: infer TArgs3): infer TOutput3
//       }
//     ? {
//         (error: unknown, ...args: TArgs1): TOutput1
//         (error: unknown, ...args: TArgs2): TOutput2
//         (error: unknown, ...args: TArgs3): TOutput3
//       }
//     : TMethod extends {
//           (error: any, ...args: infer TArgs1): infer TOutput1
//           (error: any, ...args: infer TArgs2): infer TOutput2
//         }
//       ? {
//           (error: unknown, ...args: TArgs1): TOutput1
//           (error: unknown, ...args: TArgs2): TOutput2
//         }
//       : TMethod extends (error: any, ...args: infer TArgs) => infer TOutput
//         ? (error: unknown, ...args: TArgs) => TOutput
//         : never
type BindInstanceMethod<TMethod> = TMethod extends (error: any, ...args: infer TArgs) => infer TOutput
  ? (...args: TArgs) => TOutput
  : never
type BindStaticMethod<TMethod> = TMethod extends (error: any, ...args: infer TArgs) => infer TOutput
  ? (error: unknown, ...args: TArgs) => TOutput
  : never
type ErrorMethods<TPluginsMap extends ErrorPluginsMap> = {
  [TKey in keyof TPluginsMap['methods']]: BindInstanceMethod<TPluginsMap['methods'][TKey]['fn']>
}
type ErrorResolved<TPluginsMap extends ErrorPluginsMap> = ErrorResolvedProps<TPluginsMap> & ErrorMethods<TPluginsMap>

type ErrorStaticMethods<TPluginsMap extends ErrorPluginsMap> = {
  [TKey in keyof TPluginsMap['methods']]: BindStaticMethod<TPluginsMap['methods'][TKey]['fn']>
}

type EmptyPluginsMap = {
  props: Record<never, { init: never; output: never; resolve: never }>
  methods: Record<never, ErrorMethodRecord>
}

type ErrorPluginResolved = {
  props: Record<string, ErrorPluginPropOptions<unknown>>
  methods: Record<string, ErrorPluginMethodFn<unknown>>
  adapt: Array<ErrorPluginAdaptFn<Error0, Record<string, unknown>>>
  stack?: ErrorPluginStack
  cause?: ErrorPluginCause
  message?: ErrorPluginMessage
  propKeys: string[]
  propEntries: Array<[string, ErrorPluginPropOptions<unknown>]>
  methodEntries: Array<[string, ErrorPluginMethodFn<unknown>]>
}
type Error0Mark = string | symbol
// Registered (global) symbol so a marked error is recognized by `Error0.is()`
// even across separate bundles/realms that each ship their own copy of error0.
const ERROR0_MARK = Symbol.for('@devp0nt/error0.mark')
const SKIP_ADAPT = Symbol('Error0.skipAdapt')
const RESERVED_STACK_PROP_ERROR = 'Error0: "stack" is a reserved prop key. Use .stack(...) plugin API instead'
const RESERVED_MESSAGE_PROP_ERROR = 'Error0: "message" is a reserved prop key. Use .message(...) plugin API instead'

const fromPropOptionsDefinition = (
  options: ErrorPluginPropOptionsDefinition<any, any, any, any>,
): ErrorPluginPropOptions<any, any, any, any> => {
  let resolver: ErrorPluginPropOptions<unknown>['resolve']
  if (!options.resolve) {
    resolver = (options: ErrorPluginPropOptionsResolveOptions<any, any>) => options.own
  } else if (options.resolve === true) {
    resolver = (options: ErrorPluginPropOptionsResolveOptions<any, any>) => options.flow.find((v) => v !== undefined)
  } else if (typeof options.resolve === 'function') {
    resolver = options.resolve
  } else {
    throw new Error('Invalid resolve option')
  }
  const serializer: ErrorPluginPropOptions<unknown>['serialize'] = options.serialize ?? false
  const deserializer: ErrorPluginPropOptions<unknown>['deserialize'] = options.deserialize ?? false
  return {
    ...options,
    resolve: resolver,
    serialize: serializer,
    deserialize: deserializer,
  }
}

type PluginPropsMapOf<TPlugin extends ErrorPlugin> = {
  [TKey in keyof NonNullable<TPlugin['props']>]: NonNullable<TPlugin['props']>[TKey] extends ErrorPluginPropOptions<
    any,
    infer TOutputValue,
    any,
    infer TResolveValue
  >
    ? {
        init: InferPluginPropInput<NonNullable<TPlugin['props']>[TKey]>
        output: TOutputValue
        resolve: TResolveValue
      }
    : never
}
type PluginMethodsMapOf<TPlugin extends ErrorPlugin> = {
  [TKey in keyof NonNullable<TPlugin['methods']>]: {
    fn: NonNullable<TPlugin['methods']>[TKey] extends ErrorPluginAnyMethodFn
      ? NonNullable<TPlugin['methods']>[TKey]
      : never
  }
}
type ErrorPluginsMapOfPlugin<TPlugin extends ErrorPlugin> = {
  props: PluginPropsMapOf<TPlugin>
  methods: PluginMethodsMapOf<TPlugin>
}
type ExtendErrorPluginsMap<TMap extends ErrorPluginsMap, TPlugin extends ErrorPlugin> = {
  props: TMap['props'] & ErrorPluginsMapOfPlugin<TPlugin>['props']
  methods: TMap['methods'] & ErrorPluginsMapOfPlugin<TPlugin>['methods']
}
type ExtendErrorPluginsMapWithProp<
  TMap extends ErrorPluginsMap,
  TKey extends string,
  TInputValue,
  TOutputValue,
  TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
> = ExtendErrorPluginsMap<
  TMap,
  ErrorPlugin<Record<TKey, ErrorPluginPropOptions<TInputValue, TOutputValue, Error0, TResolveValue>>>
>
type ExtendErrorPluginsMapWithMethod<
  TMap extends ErrorPluginsMap,
  TKey extends string,
  TMethod extends ErrorPluginAnyMethodFn,
> = ExtendErrorPluginsMap<TMap, ErrorPlugin<Record<never, never>, Record<TKey, TMethod>>>

type PluginsMapOf<TClass> = TClass extends { __pluginsMap?: infer TPluginsMap }
  ? TPluginsMap extends ErrorPluginsMap
    ? TPluginsMap
    : EmptyPluginsMap
  : EmptyPluginsMap
type PluginsMapOfInstance<TInstance> = TInstance extends { __pluginsMap?: infer TPluginsMap }
  ? TPluginsMap extends ErrorPluginsMap
    ? TPluginsMap
    : EmptyPluginsMap
  : EmptyPluginsMap

type PluginsMapFromParts<
  TProps extends ErrorPluginProps,
  TMethods extends ErrorPluginMethods,
> = ErrorPluginsMapOfPlugin<ErrorPlugin<TProps, TMethods>>
type ErrorInstanceOfMap<TMap extends ErrorPluginsMap> = InstanceError0<TMap>
type BuilderError0<TProps extends ErrorPluginProps, TMethods extends ErrorPluginMethods> = InstanceError0<
  PluginsMapFromParts<TProps, TMethods>
>

type PluginOfBuilder<TBuilder> =
  TBuilder extends PluginError0<infer TProps, infer TMethods> ? ErrorPlugin<TProps, TMethods> : never
type BuilderPropsOf<TBuilder> = TBuilder extends PluginError0<infer TProps, any> ? TProps : Record<never, never>
type BuilderMethodsOf<TBuilder> = TBuilder extends PluginError0<any, infer TMethods> ? TMethods : Record<never, never>

export class PluginError0<
  TProps extends ErrorPluginProps = Record<never, never>,
  TMethods extends ErrorPluginMethods = Record<never, never>,
> {
  private readonly _plugin: ErrorPlugin<ErrorPluginProps, ErrorPluginMethods>

  readonly Infer = undefined as unknown as {
    props: TProps
    methods: TMethods
  }

  constructor(plugin?: ErrorPlugin<ErrorPluginProps, ErrorPluginMethods>) {
    this._plugin = {
      props: { ...(plugin?.props ?? {}) },
      methods: { ...(plugin?.methods ?? {}) },
      adapt: [...(plugin?.adapt ?? [])],
      stack: plugin?.stack,
      cause: plugin?.cause,
      message: plugin?.message,
    }
  }

  prop<
    TKey extends string,
    TInputValue = undefined,
    TOutputValue = unknown,
    TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
  >(
    key: TKey,
    value: ErrorPluginPropOptionsDefinition<TInputValue, TOutputValue, BuilderError0<TProps, TMethods>, TResolveValue>,
  ): PluginError0<AddPropToPluginProps<TProps, TKey, TInputValue, TOutputValue, TResolveValue>, TMethods> {
    return this.use('prop', key, value)
  }

  method<TKey extends string, TMethod extends (error: BuilderError0<TProps, TMethods>, ...args: any[]) => any>(
    key: TKey,
    value: TMethod,
  ): PluginError0<TProps, AddMethodToPluginMethods<TMethods, TKey, TMethod>> {
    return this.use('method', key, value)
  }

  adapt(
    value: ErrorPluginAdaptFn<BuilderError0<TProps, TMethods>, PluginOutputProps<TProps>>,
  ): PluginError0<TProps, TMethods> {
    return this.use('adapt', value)
  }

  stack(value: ErrorPluginStack<BuilderError0<TProps, TMethods>>): PluginError0<TProps, TMethods> {
    return this.use('stack', value)
  }

  cause(value: ErrorPluginCause<BuilderError0<TProps, TMethods>>): PluginError0<TProps, TMethods> {
    return this.use('cause', value)
  }

  message(value: ErrorPluginMessage<BuilderError0<TProps, TMethods>>): PluginError0<TProps, TMethods> {
    return this.use('message', value)
  }

  use<
    TKey extends string,
    TInputValue = undefined,
    TOutputValue = unknown,
    TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
  >(
    kind: 'prop',
    key: TKey,
    value: ErrorPluginPropOptionsDefinition<TInputValue, TOutputValue, BuilderError0<TProps, TMethods>, TResolveValue>,
  ): PluginError0<AddPropToPluginProps<TProps, TKey, TInputValue, TOutputValue, TResolveValue>, TMethods>
  use<TKey extends string, TMethod extends (error: BuilderError0<TProps, TMethods>, ...args: any[]) => any>(
    kind: 'method',
    key: TKey,
    value: TMethod,
  ): PluginError0<TProps, AddMethodToPluginMethods<TMethods, TKey, TMethod>>
  use(
    kind: 'adapt',
    value: ErrorPluginAdaptFn<BuilderError0<TProps, TMethods>, PluginOutputProps<TProps>>,
  ): PluginError0<TProps, TMethods>
  use(kind: 'stack', value: ErrorPluginStack<BuilderError0<TProps, TMethods>>): PluginError0<TProps, TMethods>
  use(kind: 'cause', value: ErrorPluginCause<BuilderError0<TProps, TMethods>>): PluginError0<TProps, TMethods>
  use(kind: 'message', value: ErrorPluginMessage<BuilderError0<TProps, TMethods>>): PluginError0<TProps, TMethods>
  use<TBuilder extends PluginError0<any, any>>(
    plugin: TBuilder,
  ): PluginError0<TProps & BuilderPropsOf<TBuilder>, TMethods & BuilderMethodsOf<TBuilder>>
  use(
    kindOrPlugin: 'prop' | 'method' | 'adapt' | 'stack' | 'cause' | 'message' | PluginError0<any, any>,
    keyOrValue?: unknown,
    value?: ErrorPluginPropOptionsDefinition<unknown, unknown, any> | ErrorPluginMethodFn<unknown, unknown[], any>,
  ): PluginError0<any, any> {
    if (kindOrPlugin instanceof PluginError0) {
      const nestedPlugin = kindOrPlugin._plugin
      return new PluginError0({
        props: { ...(this._plugin.props ?? {}), ...(nestedPlugin.props ?? {}) },
        methods: { ...(this._plugin.methods ?? {}), ...(nestedPlugin.methods ?? {}) },
        adapt: [...(this._plugin.adapt ?? []), ...(nestedPlugin.adapt ?? [])],
        stack: nestedPlugin.stack ?? this._plugin.stack,
        cause: nestedPlugin.cause ?? this._plugin.cause,
        message: nestedPlugin.message ?? this._plugin.message,
      })
    }
    const kind = kindOrPlugin
    const nextProps: ErrorPluginProps = { ...(this._plugin.props ?? {}) }
    const nextMethods: ErrorPluginMethods = { ...(this._plugin.methods ?? {}) }
    const nextAdapt: Array<ErrorPluginAdaptFn<Error0, Record<string, unknown>>> = [...(this._plugin.adapt ?? [])]
    let nextStack: ErrorPluginStack | undefined = this._plugin.stack
    let nextCause: ErrorPluginCause | undefined = this._plugin.cause
    let nextMessage: ErrorPluginMessage | undefined = this._plugin.message
    if (kind === 'prop') {
      const key = keyOrValue as string
      if (key === 'stack') {
        throw new Error(RESERVED_STACK_PROP_ERROR)
      }
      if (key === 'message') {
        throw new Error(RESERVED_MESSAGE_PROP_ERROR)
      }
      if (value === undefined) {
        throw new Error('PluginError0.use("prop", key, value) requires value')
      }
      nextProps[key] = fromPropOptionsDefinition(value as ErrorPluginPropOptionsDefinition<any, any>)
    } else if (kind === 'method') {
      const key = keyOrValue as string
      if (value === undefined) {
        throw new Error('PluginError0.use("method", key, value) requires value')
      }
      nextMethods[key] = value as ErrorPluginMethodFn<any, any[]>
    } else if (kind === 'adapt') {
      nextAdapt.push(keyOrValue as ErrorPluginAdaptFn<Error0, Record<string, unknown>>)
    } else if (kind === 'stack') {
      nextStack = keyOrValue as ErrorPluginStack
    } else if (kind === 'cause') {
      nextCause = keyOrValue as ErrorPluginCause
    } else {
      nextMessage = keyOrValue as ErrorPluginMessage
    }
    return new PluginError0({
      props: nextProps,
      methods: nextMethods,
      adapt: nextAdapt,
      stack: nextStack,
      cause: nextCause,
      message: nextMessage,
    })
  }
}

type ErrorOwnStore = Record<string, unknown>

export type ClassError0<TPluginsMap extends ErrorPluginsMap = EmptyPluginsMap> = {
  MAX_CAUSES_DEPTH: number
  new (message: string, input?: ErrorInput<TPluginsMap>): InstanceError0<TPluginsMap>
  new (input: { message?: string } & ErrorInput<TPluginsMap>): InstanceError0<TPluginsMap>
  readonly __pluginsMap?: TPluginsMap
  from: <TThis extends ClassError0<any>>(this: TThis, error: unknown) => InstanceType<TThis>
  is: <TThis extends ClassError0<any>>(this: TThis, error: unknown) => error is InstanceType<TThis>
  round: <TThis extends ClassError0<any>>(this: TThis, error: unknown, isPublic?: boolean) => InstanceType<TThis>
  // flat: <TThis extends ClassError0<any>>(this: TThis, error: unknown, keepCauses?: boolean) => InstanceType<TThis>
  causes: {
    (error: unknown, instancesOnly?: false): unknown[]
    (error: unknown, instancesOnly: true): Array<InstanceError0<TPluginsMap>>
  }
  resolve: (error: unknown) => ErrorResolvedProps<TPluginsMap>
  serialize: (error: unknown, isPublic?: boolean) => Record<string, unknown>
  assign: <TThis extends ClassError0<any>>(
    this: TThis,
    error: unknown,
    props: Partial<ErrorOwnProps<PluginsMapOf<TThis>>>,
  ) => InstanceError0<PluginsMapOf<TThis>>
  own: {
    (error: object): ErrorOwnProps<TPluginsMap>
    <TKey extends keyof TPluginsMap['props'] & string>(error: object, key: TKey): ErrorOwnProps<TPluginsMap>[TKey]
  }
  flow: <TKey extends keyof TPluginsMap['props'] & string>(
    error: object,
    key: TKey,
  ) => Array<ErrorOwnProps<TPluginsMap>[TKey]>
  mark: <TThis extends ClassError0<any>>(this: TThis, mark: Error0Mark) => ClassError0<PluginsMapOf<TThis>>
  use: {
    <TBuilder extends PluginError0>(
      plugin: TBuilder,
    ): ClassError0<ExtendErrorPluginsMap<TPluginsMap, PluginOfBuilder<TBuilder>>>
    <
      TKey extends string,
      TInputValue = undefined,
      TOutputValue = unknown,
      TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
    >(
      kind: 'prop',
      key: TKey,
      value: ErrorPluginPropOptions<TInputValue, TOutputValue, ErrorInstanceOfMap<TPluginsMap>, TResolveValue>,
    ): ClassError0<ExtendErrorPluginsMapWithProp<TPluginsMap, TKey, TInputValue, TOutputValue, TResolveValue>>
    <TKey extends string, TMethod extends (error: ErrorInstanceOfMap<TPluginsMap>, ...args: any[]) => any>(
      kind: 'method',
      key: TKey,
      value: TMethod,
    ): ClassError0<ExtendErrorPluginsMapWithMethod<TPluginsMap, TKey, TMethod>>
    (
      kind: 'adapt',
      value: ErrorPluginAdaptFn<ErrorInstanceOfMap<TPluginsMap>, ErrorResolvedProps<TPluginsMap>>,
    ): ClassError0<TPluginsMap>
    (kind: 'stack', value: ErrorPluginStack<ErrorInstanceOfMap<TPluginsMap>>): ClassError0<TPluginsMap>
    (kind: 'cause', value: ErrorPluginCause<ErrorInstanceOfMap<TPluginsMap>>): ClassError0<TPluginsMap>
    (kind: 'message', value: ErrorPluginMessage<ErrorInstanceOfMap<TPluginsMap>>): ClassError0<TPluginsMap>
  }
  plugin: () => PluginError0
} & ErrorStaticMethods<TPluginsMap>

export class Error0 extends Error {
  static readonly __pluginsMap?: EmptyPluginsMap
  declare readonly __pluginsMap?: EmptyPluginsMap
  static MAX_CAUSES_DEPTH = 99
  protected static _plugins: ErrorPlugin[] = []
  protected static _resolvedPlugin?: ErrorPluginResolved
  declare own?: ErrorOwnStore
  declare readonly resolveByKeyCache: Map<string, unknown>

  private static readonly _emptyPlugin: ErrorPluginResolved = {
    props: {},
    methods: {},
    adapt: [],
    stack: undefined,
    cause: undefined,
    message: undefined,
    propKeys: [],
    propEntries: [],
    methodEntries: [],
  }

  private static _indexResolvedPlugin(
    resolved: Omit<ErrorPluginResolved, 'propKeys' | 'propEntries' | 'methodEntries'>,
  ): ErrorPluginResolved {
    return {
      ...resolved,
      propKeys: Object.keys(resolved.props),
      propEntries: Object.entries(resolved.props),
      methodEntries: Object.entries(resolved.methods),
    }
  }

  private static _applyPlugin(
    resolved: Omit<ErrorPluginResolved, 'propKeys' | 'propEntries' | 'methodEntries'>,
    plugin: ErrorPlugin,
  ): void {
    if (plugin.props && 'stack' in plugin.props) {
      throw new Error(RESERVED_STACK_PROP_ERROR)
    }
    if (plugin.props && 'message' in plugin.props) {
      throw new Error(RESERVED_MESSAGE_PROP_ERROR)
    }
    Object.assign(resolved.props, plugin.props ?? this._emptyPlugin.props)
    Object.assign(resolved.methods, plugin.methods ?? this._emptyPlugin.methods)
    resolved.adapt.push(...(plugin.adapt ?? this._emptyPlugin.adapt))
    if (typeof plugin.stack !== 'undefined') {
      resolved.stack = plugin.stack
    }
    if (typeof plugin.cause !== 'undefined') {
      resolved.cause = plugin.cause
    }
    if (typeof plugin.message !== 'undefined') {
      resolved.message = plugin.message
    }
  }

  private static _mergeResolvedPlugin(
    this: typeof Error0,
    base: ErrorPluginResolved,
    plugin: ErrorPlugin,
  ): ErrorPluginResolved {
    const merged: Omit<ErrorPluginResolved, 'propKeys' | 'propEntries' | 'methodEntries'> = {
      props: { ...base.props },
      methods: { ...base.methods },
      adapt: [...base.adapt],
      stack: base.stack,
      cause: base.cause,
      message: base.message,
    }
    this._applyPlugin(merged, plugin)
    return this._indexResolvedPlugin(merged)
  }

  private static _getResolvedPlugin(this: typeof Error0): ErrorPluginResolved {
    if (Object.prototype.hasOwnProperty.call(this, '_resolvedPlugin') && this._resolvedPlugin) {
      return this._resolvedPlugin
    }
    const resolved: ErrorPluginResolved = {
      props: {},
      methods: {},
      adapt: [],
      propKeys: [],
      propEntries: [],
      methodEntries: [],
    }
    for (const plugin of this._plugins) {
      this._applyPlugin(resolved, plugin)
    }
    const indexed = this._indexResolvedPlugin(resolved)
    Object.defineProperty(this, '_resolvedPlugin', {
      value: indexed,
      writable: true,
      enumerable: false,
      configurable: true,
    })
    return indexed
  }

  constructor(message: string, input?: ErrorInput<EmptyPluginsMap>)
  constructor(input: { message?: string } & ErrorInput<EmptyPluginsMap>)
  constructor(
    ...args:
      | [message: string, input?: ErrorInput<EmptyPluginsMap>]
      | [{ message?: string } & ErrorInput<EmptyPluginsMap>]
  ) {
    const [first, second] = args
    const input = typeof first === 'string' ? { message: first, ...(second ?? {}) } : first
    const shouldAdapt = !(SKIP_ADAPT in input)

    super(input.message || 'Unknown error', { cause: input.cause })
    this.name = 'Error0'

    Object.defineProperty(this, 'resolveByKeyCache', {
      value: new Map<string, unknown>(),
      writable: false,
      enumerable: false,
      configurable: false,
    })
    const ctor = this.constructor as typeof Error0
    const mark = ctor._getMark()
    if (mark !== undefined) {
      Object.defineProperty(this, ERROR0_MARK, {
        value: mark,
        writable: false,
        enumerable: false,
        configurable: false,
      })
    }
    const plugin = ctor._getResolvedPlugin()
    // const ownStore = Object.create(null) as ErrorOwnStore
    // Object.defineProperty(this, OWN_SYMBOL, { value: ownStore, writable: true, enumerable: false, configurable: true })

    for (const [key, prop] of plugin.propEntries) {
      if (key === 'stack') {
        continue
      }
      Object.defineProperty(this, key, {
        get: () => this._resolveByKey(key, plugin),
        set: (value) => {
          this.assign({ [key]: value } as never)
        },
        enumerable: true,
        configurable: true,
      })
      if (key in input) {
        const inputValue = (input as Record<string, unknown>)[key]
        const ownValue = typeof prop.init === 'function' ? prop.init(inputValue) : inputValue
        this.assign({ [key]: ownValue } as never)
      }
    }
    if (shouldAdapt) {
      ctor._applyAdapt(this)
    }
    // Walk starting from `this` so the Error0's own stack also gets remapped, not just causes.
    // The walk then continues through this.cause (= input.cause) and any nested causes.
    Error0.fixStack(this)
  }

  private static fixStack(start: unknown): void {
    if (process.env.NODE_ENV === 'production') return
    const hook = (globalThis as any).__ERROR0_FIX_STACKTRACE__
    if (typeof hook !== 'function') return
    // Walk `start` + its cause chain, calling the hook on each link.
    // seen-set guards against circular `cause` graphs; depth cap is a belt-and-braces backstop.
    const seen = new Set<unknown>()
    const maxDepth = 99
    let next: unknown = start
    let depth = 0
    while (next && depth < maxDepth && !seen.has(next)) {
      seen.add(next)
      try {
        hook(next)
      } catch {}
      next = (next as { cause?: unknown }).cause
      depth++
    }
  }

  static own<TThis extends typeof Error0>(this: TThis, error: unknown): ErrorOwnProps<PluginsMapOf<TThis>>
  static own<TThis extends typeof Error0, TKey extends keyof PluginsMapOf<TThis>['props'] & string>(
    this: TThis,
    error: unknown,
    key: TKey,
  ): ErrorOwnProps<PluginsMapOf<TThis>>[TKey]
  static own(error: unknown, key?: string): unknown {
    const error0 = this.from(error)
    if (key === undefined) {
      return error0.own ?? {}
    }
    return error0.own?.[key]
  }

  static flow<TThis extends typeof Error0, TKey extends keyof PluginsMapOf<TThis>['props'] & string>(
    this: TThis,
    error: unknown,
    key: TKey,
  ): Array<ErrorOwnProps<PluginsMapOf<TThis>>[TKey]>
  static flow(error: unknown, key: string): unknown[] {
    const error0 = this.from(error)
    return error0.flow(key as never)
  }
  flow<TThis extends Error0, TKey extends keyof PluginsMapOfInstance<TThis>['props'] & string>(
    this: TThis,
    key: TKey,
  ): Array<ErrorOwnProps<PluginsMapOfInstance<TThis>>[TKey]>
  flow(key: string): unknown[] {
    const causes = this.causes(true)
    const values = new Array<unknown>(causes.length)
    for (let i = 0; i < causes.length; i += 1) {
      values[i] = causes[i].own?.[key]
    }
    return values
  }

  // private readonly [_resolveByKeyCacheSymbol] = new Map<string, unknown>()
  private _resolveByKey(key: string, plugin: ErrorPluginResolved): unknown {
    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    const error = this
    if (this.resolveByKeyCache.has(key)) {
      return this.resolveByKeyCache.get(key)
    }
    const value = (() => {
      try {
        const options = {
          get flow() {
            return error.flow(key as never)
          },
          own: error.own?.[key],
          error,
        }
        const prop = plugin.props[key]
        const resolver = prop.resolve
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!resolver) {
          return (error as any)[key]
        }
        return resolver(options as ErrorPluginPropOptionsResolveOptions<any, any>)
      } catch {
        // eslint-disable-next-line no-console
        console.error(`Error0: failed to resolve property ${key}`, error)
        return undefined
      }
    })()
    this.resolveByKeyCache.set(key, value)
    return value
  }

  static resolve<TThis extends typeof Error0>(this: TThis, error: unknown): ErrorResolvedProps<PluginsMapOf<TThis>>
  static resolve(error: unknown): Record<string, unknown>
  static resolve(error: unknown): Record<string, unknown> {
    return this.from(error).resolve()
  }
  resolve<TThis extends Error0>(this: TThis): ErrorResolvedProps<PluginsMapOfInstance<TThis>>
  resolve(): Record<string, unknown> {
    const ctor = this.constructor as typeof Error0
    const plugin = ctor._getResolvedPlugin()
    const resolved: Record<string, unknown> = {}
    for (const key of plugin.propKeys) {
      resolved[key] = this._resolveByKey(key, plugin)
    }
    return resolved
  }

  static causes(error: unknown, instancesOnly?: false): unknown[]
  static causes<T extends typeof Error0>(this: T, error: unknown, instancesOnly: true): Array<InstanceType<T>>
  static causes(error: unknown, instancesOnly?: boolean): unknown[] {
    const causes: unknown[] = []
    let current: unknown = error
    const seen = new Set<unknown>()
    let depth = 0
    while (depth < this.MAX_CAUSES_DEPTH) {
      if (seen.has(current)) {
        break
      }
      seen.add(current)
      // Skip nullish links: `undefined`/`null` mean "no cause", not a link in the chain.
      // Without this guard the walk pushes the final error's `undefined` cause as a
      // trailing element (e.g. [outer, inner, undefined]).
      if (current != null && (!instancesOnly || this.is(current))) {
        causes.push(current)
      }
      if (!current || typeof current !== 'object') {
        break
      }
      current = (current as { cause?: unknown }).cause
      depth += 1
    }
    return causes
  }
  causes<TThis extends Error0>(this: TThis, instancesOnly?: false): [TThis, ...unknown[]]
  causes<TThis extends Error0>(this: TThis, instancesOnly: true): [TThis, ...TThis[]]
  causes(instancesOnly?: boolean): unknown[] {
    const ctor = this.constructor as typeof Error0
    if (instancesOnly) {
      return ctor.causes(this, true)
    }
    return ctor.causes(this)
  }

  static is<T extends typeof Error0>(this: T, error: unknown): error is InstanceType<T> {
    if (error instanceof this) {
      return true
    }
    if (!(error instanceof Error)) {
      return false
    }
    const mark = this._getMark()
    if (mark === undefined) {
      return false
    }
    return (error as unknown as { [key: symbol]: unknown })[ERROR0_MARK] === mark
  }

  static isSerialized(error: unknown): error is Record<string, unknown> {
    return (
      !this.is(error) &&
      !(error instanceof Error) &&
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    )
  }

  static from<TThis extends typeof Error0>(this: TThis, error: unknown): InstanceType<TThis>
  static from(error: unknown): Error0 {
    if (this.is(error)) {
      return error
    }
    if (this.isSerialized(error)) {
      return this._fromSerialized(error)
    }
    return this._fromNonError0(error)
  }

  static round<TThis extends typeof Error0>(this: TThis, error: unknown, isPublic?: boolean): InstanceType<TThis>
  static round(error: unknown, isPublic = false): Error0 {
    return this.from(error).round(isPublic)
  }
  round<TThis extends Error0>(this: TThis, isPublic = true): TThis {
    const ctor = this.constructor as typeof Error0
    return ctor.from(this.serialize(isPublic)) as TThis
  }

  // static flat<TThis extends typeof Error0>(this: TThis, error: unknown, keepCauses?: boolean): InstanceType<TThis>
  // static flat(error: unknown, keepCauses = false): Error0 {
  //   return this.from(error).flat(keepCauses)
  // }
  // flat<TThis extends Error0>(this: TThis, keepCauses = false): TThis {
  //   const ctor = this.constructor as typeof Error0
  //   // eslint-disable-next-line new-cap
  //   const error = new ctor(this.message) as TThis
  //   if (keepCauses) {
  //     error.cause = this.cause
  //   }
  //   error.assign({
  //     // ...this.own,
  //     ...this.resolve(),
  //   } as never)
  //   error.stack =
  //     this.causes()
  //       .map((cause, index) => {
  //         return cause instanceof Error && cause.stack && typeof cause.stack === 'string'
  //           ? index === 0
  //             ? cause.stack
  //             : cause.stack.split('\n').slice(1).join('\n')
  //           : undefined
  //       })
  //       .join('\n') || undefined
  //   return error
  // }

  static assign<TThis extends typeof Error0>(
    this: TThis,
    error: unknown,
    props: Partial<ErrorOwnProps<PluginsMapOf<TThis>>>,
  ): InstanceType<TThis>
  static assign(error: unknown, props: Record<string, unknown>): Error0 {
    const error0 = this.from(error)
    return error0.assign(props)
  }
  assign<TThis extends Error0>(this: TThis, props: Partial<ErrorOwnProps<PluginsMapOfInstance<TThis>>>): TThis
  assign(props: Record<string, unknown>): this {
    this.own = Object.assign(this.own ?? {}, props)
    this.resolveByKeyCache.clear()
    // const values = Object.values(props)
    // if (values.every((value) => value === undefined)) {
    //   this.own = undefined
    // }
    return this
  }

  private static _applyAdapt(error: Error0): Error0 {
    const plugin = this._getResolvedPlugin()
    for (const adapt of plugin.adapt) {
      const adapted = adapt(error as any)
      if (adapted && typeof adapted === 'object') {
        error.assign(adapted)
      }
    }
    return error
  }

  private static _fromSerialized(error: unknown): Error0 {
    const message = this._extractMessage(error)
    if (typeof error !== 'object' || error === null) {
      return new this(message, { cause: error })
    }
    const errorRecord = error as Record<string, unknown>
    const recreated = new this({ message, [SKIP_ADAPT]: true } as never)
    const plugin = this._getResolvedPlugin()
    for (const [key, prop] of plugin.propEntries) {
      if (prop.deserialize === false) {
        continue
      }
      if (!(key in errorRecord)) {
        continue
      }
      try {
        const value = prop.deserialize({ value: errorRecord[key], record: errorRecord })
        ;(recreated as unknown as Record<string, unknown>)[key] = value
      } catch {
        // eslint-disable-next-line no-console
        console.error(`Error0: failed to deserialize property ${key}`, errorRecord)
      }
    }
    if ('stack' in errorRecord && typeof errorRecord.stack === 'string') {
      recreated.stack = errorRecord.stack
    }
    const causePlugin = plugin.cause
    if (causePlugin && 'cause' in errorRecord) {
      try {
        ;(recreated as { cause?: unknown }).cause = causePlugin.deserialize({
          cause: errorRecord.cause,
          error: errorRecord,
          isSerialized: (serializedCause) => this.isSerialized(serializedCause),
          fromSerialized: (serializedCause) => this._fromSerialized(serializedCause),
        })
      } catch {
        // eslint-disable-next-line no-console
        console.error('Error0: failed to deserialize cause', errorRecord)
      }
    }
    return recreated
  }

  private static _fromNonError0(error: unknown): Error0 {
    const message = this._extractMessage(error)
    return new this(message, { cause: error })
  }

  private static _extractMessage(error: unknown): string {
    return (
      (typeof error === 'string'
        ? error
        : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : undefined) || 'Unknown error'
    )
  }

  private static _getMark(this: typeof Error0): Error0Mark | undefined {
    const mark = (this as unknown as { [key: symbol]: unknown })[ERROR0_MARK]
    return typeof mark === 'string' || typeof mark === 'symbol' ? mark : undefined
  }

  static mark<TThis extends typeof Error0>(this: TThis, mark: Error0Mark): ClassError0<PluginsMapOf<TThis>> {
    if (typeof mark !== 'string' && typeof mark !== 'symbol') {
      throw new Error('Error0.mark(mark) expects mark to be a string or symbol')
    }
    const Base = this as unknown as typeof Error0
    const Error0Marked = class Error0 extends Base {}
    Object.defineProperty(Error0Marked, ERROR0_MARK, {
      value: mark,
      writable: false,
      enumerable: false,
      configurable: true,
    })
    return Error0Marked as unknown as ClassError0<PluginsMapOf<TThis>>
  }

  private static _useWithPlugin(
    this: typeof Error0,
    plugin: ErrorPlugin<ErrorPluginProps, ErrorPluginMethods>,
  ): ClassError0 {
    const Base = this as unknown as typeof Error0
    const Error0Extended = class Error0 extends Base {}
    ;(Error0Extended as typeof Error0)._plugins = [...Base._plugins, plugin]
    const resolved = this._mergeResolvedPlugin(Base._getResolvedPlugin(), plugin)
    ;(Error0Extended as typeof Error0)._resolvedPlugin = resolved
    for (const [key, method] of resolved.methodEntries) {
      Object.defineProperty((Error0Extended as typeof Error0).prototype, key, {
        value: function (...args: unknown[]) {
          return method(this as Error0, ...args)
        },
        writable: true,
        enumerable: true,
        configurable: true,
      })
      Object.defineProperty(Error0Extended, key, {
        value: function (error: unknown, ...args: unknown[]) {
          return method(this.from(error), ...args)
        },
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }

    return Error0Extended as unknown as ClassError0
  }

  private static _pluginFromBuilder(plugin: PluginError0): ErrorPlugin<ErrorPluginProps, ErrorPluginMethods> {
    const pluginRecord = plugin as unknown as {
      _plugin: ErrorPlugin<ErrorPluginProps, ErrorPluginMethods>
    }
    return {
      props: { ...(pluginRecord._plugin.props ?? {}) },
      methods: { ...(pluginRecord._plugin.methods ?? {}) },
      adapt: [...(pluginRecord._plugin.adapt ?? [])],
      stack: pluginRecord._plugin.stack,
      cause: pluginRecord._plugin.cause,
      message: pluginRecord._plugin.message,
    }
  }

  static use<TThis extends typeof Error0, TBuilder extends PluginError0>(
    this: TThis,
    plugin: TBuilder,
  ): ClassError0<ExtendErrorPluginsMap<PluginsMapOf<TThis>, PluginOfBuilder<TBuilder>>>
  static use<
    TThis extends typeof Error0,
    TKey extends string,
    TInputValue = undefined,
    TOutputValue = unknown,
    TResolveValue extends TOutputValue | undefined = TOutputValue | undefined,
  >(
    this: TThis,
    kind: 'prop',
    key: TKey,
    value: ErrorPluginPropOptionsDefinition<
      TInputValue,
      TOutputValue,
      ErrorInstanceOfMap<PluginsMapOf<TThis>>,
      TResolveValue
    >,
  ): ClassError0<ExtendErrorPluginsMapWithProp<PluginsMapOf<TThis>, TKey, TInputValue, TOutputValue, TResolveValue>>
  static use<
    TThis extends typeof Error0,
    TKey extends string,
    TMethod extends (error: ErrorInstanceOfMap<PluginsMapOf<TThis>>, ...args: any[]) => any,
  >(
    this: TThis,
    kind: 'method',
    key: TKey,
    value: TMethod,
  ): ClassError0<ExtendErrorPluginsMapWithMethod<PluginsMapOf<TThis>, TKey, TMethod>>
  static use<TThis extends typeof Error0>(
    this: TThis,
    kind: 'adapt',
    value: ErrorPluginAdaptFn<ErrorInstanceOfMap<PluginsMapOf<TThis>>, ErrorResolvedProps<PluginsMapOf<TThis>>>,
  ): ClassError0<PluginsMapOf<TThis>>
  static use<TThis extends typeof Error0>(
    this: TThis,
    kind: 'stack',
    value: ErrorPluginStack<ErrorInstanceOfMap<PluginsMapOf<TThis>>>,
  ): ClassError0<PluginsMapOf<TThis>>
  static use<TThis extends typeof Error0>(
    this: TThis,
    kind: 'cause',
    value: ErrorPluginCause<ErrorInstanceOfMap<PluginsMapOf<TThis>>>,
  ): ClassError0<PluginsMapOf<TThis>>
  static use<TThis extends typeof Error0>(
    this: TThis,
    kind: 'message',
    value: ErrorPluginMessage<ErrorInstanceOfMap<PluginsMapOf<TThis>>>,
  ): ClassError0<PluginsMapOf<TThis>>
  static use(
    this: typeof Error0,
    first: PluginError0 | 'prop' | 'method' | 'adapt' | 'stack' | 'cause' | 'message',
    key?: unknown,
    value?: ErrorPluginPropOptionsDefinition<unknown> | ErrorPluginMethodFn<unknown>,
  ): ClassError0<any> {
    if (first instanceof PluginError0) {
      return this._useWithPlugin(this._pluginFromBuilder(first))
    }
    if (first === 'stack') {
      if (typeof key === 'undefined') {
        throw new Error('Error0.use("stack", value) requires stack plugin value')
      }
      if (typeof key !== 'object' || key === null || typeof (key as { serialize?: unknown }).serialize !== 'function') {
        throw new Error('Error0.use("stack", value) expects { serialize: function }')
      }
      return this._useWithPlugin({
        stack: key as ErrorPluginStack,
      })
    }
    if (first === 'cause') {
      if (typeof key === 'undefined') {
        throw new Error('Error0.use("cause", value) requires cause plugin value')
      }
      if (
        typeof key !== 'object' ||
        key === null ||
        typeof (key as { serialize?: unknown }).serialize !== 'function' ||
        typeof (key as { deserialize?: unknown }).deserialize !== 'function'
      ) {
        throw new Error('Error0.use("cause", value) expects { serialize: function, deserialize: function }')
      }
      return this._useWithPlugin({
        cause: key as ErrorPluginCause,
      })
    }
    if (first === 'message') {
      if (typeof key === 'undefined') {
        throw new Error('Error0.use("message", value) requires message plugin value')
      }
      if (typeof key !== 'object' || key === null || typeof (key as { serialize?: unknown }).serialize !== 'function') {
        throw new Error('Error0.use("message", value) expects { serialize: function }')
      }
      return this._useWithPlugin({
        message: key as ErrorPluginMessage,
      })
    }
    if (first === 'adapt') {
      if (typeof key !== 'function') {
        throw new Error('Error0.use("adapt", value) requires adapt function')
      }
      return this._useWithPlugin({
        adapt: [key as ErrorPluginAdaptFn<Error0, Record<string, unknown>>],
      })
    }
    if (typeof key !== 'string' || value === undefined) {
      throw new Error('Error0.use(kind, key, value) requires key and value')
    }

    if (first === 'prop') {
      if (key === 'stack') {
        throw new Error(RESERVED_STACK_PROP_ERROR)
      }
      if (key === 'message') {
        throw new Error(RESERVED_MESSAGE_PROP_ERROR)
      }
      return this._useWithPlugin({
        props: { [key]: fromPropOptionsDefinition(value as ErrorPluginPropOptionsDefinition<any, any>) },
      })
    }
    return this._useWithPlugin({
      methods: { [key]: value as ErrorPluginMethodFn<unknown> },
    })
  }

  static plugin(): PluginError0 {
    return new PluginError0()
  }

  static serialize(error: unknown, isPublic = true): Record<string, unknown> {
    return this.from(error).serialize(isPublic)
  }

  serialize(isPublic = true): Record<string, unknown> {
    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    const error0 = this
    const ctor = error0.constructor as typeof Error0
    const plugin = ctor._getResolvedPlugin()
    const messagePlugin = plugin.message
    let serializedMessage: unknown = error0.message
    try {
      if (messagePlugin) {
        serializedMessage = messagePlugin.serialize({ value: error0.message, error: error0, isPublic })
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error('Error0: failed to serialize message', error0)
      serializedMessage = error0.message
    }
    const json: Record<string, unknown> = {}
    if (serializedMessage !== undefined) {
      json.message = serializedMessage
    }

    for (const [key, prop] of plugin.propEntries) {
      if (prop.serialize === false) {
        continue
      }
      try {
        const options = {
          get flow() {
            return error0.flow(key as never)
          },
          get resolved() {
            return error0._resolveByKey(key, plugin)
          },
          own: error0.own?.[key],
          error: error0,
          isPublic,
        }
        const jsonValue = prop.serialize(options as ErrorPluginPropSerializeOptions<any, any, any>)
        if (jsonValue !== undefined) {
          json[key] = jsonValue
        }
      } catch {
        // eslint-disable-next-line no-console
        console.error(`Error0: failed to serialize property ${key}`, error0)
      }
    }
    const stackPlugin = plugin.stack
    try {
      let serializedStack: unknown
      if (stackPlugin) {
        serializedStack = stackPlugin.serialize({ value: error0.stack, error: error0, isPublic })
      } else {
        serializedStack = isPublic ? undefined : error0.stack
      }
      if (serializedStack !== undefined) {
        json.stack = serializedStack
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error('Error0: failed to serialize stack', error0)
    }
    const causePlugin = plugin.cause
    if (causePlugin?.serialize) {
      try {
        const serializedCause = causePlugin.serialize({
          cause: (error0 as { cause?: unknown }).cause,
          error: error0,
          isPublic,
          is: (cause) => ctor.is(cause),
          serialize: (cause) => ctor.serialize(cause, isPublic),
        })
        if (serializedCause !== undefined) {
          json.cause = serializedCause
        }
      } catch {
        // eslint-disable-next-line no-console
        console.error('Error0: failed to serialize cause', error0)
      }
    }
    return json
  }
}
