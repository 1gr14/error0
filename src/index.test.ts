import { describe, expect, expectTypeOf, it } from 'bun:test'
import * as assert from 'node:assert'
import z, { ZodError } from 'zod'
import { Error0 } from './index.js'
import type { ClassError0 } from './index.js'

const fixStack = (stack: string | undefined) => {
  if (!stack) {
    return stack
  }
  // at <anonymous> (/Users/x/error0.test.ts:103:25)
  // ↓
  // at <anonymous> (...)
  const lines = stack.split('\n')
  const fixedLines = lines.map((line) => {
    const withoutPath = line.replace(/\(.*\)$/, '(...)')
    return withoutPath
  })
  return fixedLines.join('\n')
}

describe('Error0', () => {
  const statusPlugin = Error0.plugin()
    .prop('status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find(Boolean),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    .method('isStatus', (error, status: number) => error.status === status)

  const codes = ['NOT_FOUND', 'BAD_REQUEST', 'UNAUTHORIZED'] as const
  type Code = (typeof codes)[number]
  const codePlugin = Error0.plugin().use('prop', 'code', {
    init: (input: Code) => input,
    resolve: ({ flow }) => flow.find(Boolean),
    serialize: ({ resolved, isPublic }) => (isPublic ? undefined : resolved),
    deserialize: ({ value }) =>
      typeof value === 'string' && codes.includes(value as Code) ? (value as Code) : undefined,
  })

  it('simple', () => {
    const error = new Error0('test')
    expect(error).toBeInstanceOf(Error0)
    expect(error).toBeInstanceOf(Error)
    expect(error).toMatchInlineSnapshot(`[Error0: test]`)
    expect(error.message).toBe('test')
    expect(error.stack).toBeDefined()
    expect(fixStack(error.stack)).toMatchInlineSnapshot(`
      "Error0: test
          at <anonymous> (...)"
    `)
  })

  it('with direct prop plugin', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find(Boolean),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const error = new AppError('test', { status: 400 })
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error0)
    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(400)
    expect(error).toMatchInlineSnapshot(`[Error0: test]`)
    expect(error.stack).toBeDefined()
    expect(fixStack(error.stack)).toMatchInlineSnapshot(`
      "Error0: test
          at <anonymous> (...)"
    `)
    expectTypeOf<typeof AppError>().toExtend<ClassError0>()
  })

  it('can have mark, which will be used when calling .is to detect if it is error0 error', () => {
    const AppError1 = Error0.mark(Symbol.for('AppError')).use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find(Boolean),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })

    const AppError2 = AppError1.use(codePlugin)
    const error1 = new AppError1('test', { status: 401 })
    const error2 = new AppError2('test', { code: 'NOT_FOUND', status: 402 })
    expect(error1).toBeInstanceOf(AppError1)
    expect(error1).not.toBeInstanceOf(AppError2)
    expect(error2).toBeInstanceOf(AppError1)
    expect(error2).toBeInstanceOf(AppError2)
    expect(AppError1.is(error1)).toBe(true)
    expect(AppError2.is(error1)).toBe(true)
    expect(AppError1.is(error2)).toBe(true)
    expect(AppError2.is(error2)).toBe(true)
  })

  it('can have no message', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find(Boolean),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })

    const error = new AppError({ status: 400 })
    expect(error.status).toBe(400)
    expect(error.message).toBe('Unknown error')
  })

  it('class helpers prop/method/adapt mirror use API', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (value: number) => value,
      resolve: ({ own, flow }) => {
        return typeof own === 'number' ? own : undefined
      },
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
      .use('method', 'isStatus', (error, expectedStatus: number) => error.status === expectedStatus)
      .use('adapt', (error) => {
        if (error.cause instanceof Error && error.status === undefined) {
          return { status: 500 }
        }
        return undefined
      })

    const error = AppError.from(new Error('inner'))
    expect(error.status).toBe(500)
    expect(error.isStatus(500)).toBe(true)
    expect(AppError.isStatus(error, 500)).toBe(true)
    expectTypeOf<typeof AppError>().toExtend<ClassError0>()
  })

  it('with defined plugin', () => {
    const AppError = Error0.use(statusPlugin)
    const error = new AppError('test', { status: 400 })
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error0)
    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(400)
    expect(error).toMatchInlineSnapshot(`[Error0: test]`)
    expect(error.stack).toBeDefined()
    expect(fixStack(error.stack)).toMatchInlineSnapshot(`
      "Error0: test
          at <anonymous> (...)"
    `)
  })

  it('allows composing plugin builders inside plugin builders', () => {
    const combinedPlugin = Error0.plugin().use(statusPlugin).use(codePlugin)
    const AppError = Error0.use(combinedPlugin)
    const error = new AppError('test', { status: 400, code: 'NOT_FOUND' })

    expect(error.status).toBe(400)
    expect(error.code).toBe('NOT_FOUND')
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expectTypeOf<typeof error.code>().toEqualTypeOf<'NOT_FOUND' | 'BAD_REQUEST' | 'UNAUTHORIZED' | undefined>()
  })

  it('twice used Error0 extends previous by types', () => {
    const AppError1 = Error0.use(statusPlugin)
    const AppError2 = AppError1.use(codePlugin)
    const error1 = new AppError1('test', { status: 400 })
    const error2 = new AppError2('test', { status: 400, code: 'NOT_FOUND' })
    expect(error1.status).toBe(400)
    expect(error2.status).toBe(400)
    expect(error2.code).toBe('NOT_FOUND')
    expectTypeOf<typeof error2.status>().toEqualTypeOf<number | undefined>()
    expectTypeOf<typeof error2.code>().toEqualTypeOf<'NOT_FOUND' | 'BAD_REQUEST' | 'UNAUTHORIZED' | undefined>()
    expectTypeOf<typeof AppError1>().toExtend<ClassError0>()
    expectTypeOf<typeof AppError2>().toExtend<ClassError0>()
    expectTypeOf<typeof AppError2>().toExtend<typeof AppError1>()
    expectTypeOf<typeof AppError1>().not.toExtend<typeof AppError2>()
  })

  it('can have cause', () => {
    const AppError = Error0.use(statusPlugin)
    const anotherError = new Error('another error')
    const error = new AppError('test', { status: 400, cause: anotherError })
    expect(error.status).toBe(400)
    expect(error).toMatchInlineSnapshot(`[Error0: test]`)
    expect(error.stack).toBeDefined()
    expect(fixStack(error.stack)).toMatchInlineSnapshot(`
      "Error0: test
          at <anonymous> (...)"
    `)
    expect(Error0.causes(error)).toEqual([error, anotherError])
  })

  it('can have many causes', () => {
    const AppError = Error0.use(statusPlugin)
    const anotherError = new Error('another error')
    const error1 = new AppError('test1', { status: 400, cause: anotherError })
    const error2 = new AppError('test2', { status: 400, cause: error1 })
    expect(error1.status).toBe(400)
    expect(error2.status).toBe(400)
    expect(Error0.causes(error2)).toEqual([error2, error1, anotherError])
  })

  it('can limit causes depth via MAX_CAUSES_DEPTH on class', () => {
    const AppError = Error0.use(statusPlugin)
    const base = new AppError('base', { status: 400 })
    const level1 = new AppError('level1', { status: 401, cause: base })
    const level2 = new AppError('level2', { status: 402, cause: level1 })

    AppError.MAX_CAUSES_DEPTH = 2
    expect(AppError.causes(level2)).toEqual([level2, level1])

    AppError.MAX_CAUSES_DEPTH = 999
    expect(AppError.causes(level2)).toEqual([level2, level1, base])
  })

  it('properties floating', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const anotherError = new Error('another error')
    const error1 = new AppError('test1', { status: 400, cause: anotherError })
    const error2 = new AppError('test2', { code: 'NOT_FOUND', cause: error1 })
    expect(error1.status).toBe(400)
    expect(error1.code).toBe(undefined)
    expect(error2.status).toBe(400)
    expect(error2.code).toBe('NOT_FOUND')
    expect(Error0.causes(error2)).toEqual([error2, error1, anotherError])
  })

  it('property getter return resolved value, not own value', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: () => 500,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const error = new AppError('another error', { status: 400 })
    expect(error.status).toBe(500)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number>()
    expect(error.own?.status).toBe(400)
    expect(error.flow('status')).toEqual([400])
  })

  it('without resolve, getter return own value, also resolved value eq to own value', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const error = new AppError('another error', { status: 400 })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(400)
    expect(error.flow('status')).toEqual([400])
    expect(error.serialize().status).toEqual(400)
  })

  it('without resolve (as false), getter return own value, also resolved value eq to own value', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: false,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const error = new AppError('another error', { status: 400 })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(400)
    expect(error.flow('status')).toEqual([400])
    expect(error.serialize().status).toEqual(400)
  })

  it('with resolve true, getter return first not undefined in flow', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: true,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const cause = new AppError('another error', { status: 400 })
    const error = new AppError('test', { cause })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(undefined)
    expect(error.flow('status')).toEqual([undefined, 400])
    expect(error.serialize().status).toEqual(400)
  })

  it('(plugin) without resolve, getter return own value, also resolved value eq to own value', () => {
    const statusPlugin = Error0.plugin().prop('status', {
      init: (input: number) => input,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const AppError = Error0.use(statusPlugin)
    const error = new AppError('another error', { status: 400 })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(400)
    expect(error.flow('status')).toEqual([400])
    expect(error.serialize().status).toEqual(400)
  })

  it('(plugin) without resolve (as false), getter return own value, also resolved value eq to own value', () => {
    const statusPlugin = Error0.plugin().prop('status', {
      init: (input: number) => input,
      resolve: false,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const AppError = Error0.use(statusPlugin)
    const error = new AppError('another error', { status: 400 })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(400)
    expect(error.flow('status')).toEqual([400])
    expect(error.serialize().status).toEqual(400)
  })

  it('without serailize and deserialize value will not be serialized', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: true,
    })
    const cause = new AppError('another error', { status: 400 })
    const error = new AppError('test', { cause })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(undefined)
    expect(error.flow('status')).toEqual([undefined, 400])
    expect(error.serialize().status).toEqual(undefined)
  })

  it('(plugin) with resolve true, getter return first not undefined in flow', () => {
    const statusPlugin = Error0.plugin().prop('status', {
      init: (input: number) => input,
      resolve: true,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
    const AppError = Error0.use(statusPlugin)
    const cause = new AppError('another error', { status: 400 })
    const error = new AppError('test', { cause })
    expect(error.status).toBe(400)
    expectTypeOf<typeof error.status>().toEqualTypeOf<number | undefined>()
    expect(error.own?.status).toBe(undefined)
    expect(error.flow('status')).toEqual([undefined, 400])
    expect(error.serialize().status).toEqual(400)
  })

  it('assign props check types', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 401 })
    // @ts-expect-error - code is not match desirecd type
    error.assign({ code: 'NOT_VALID_CODE' })
  })

  it('assign props', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 401 })
    const error2 = error.assign({ code: 'NOT_FOUND' })
    expect(error).toBe(error2)
    expect(error2.status).toBe(401)
    expect(error2.code).toBe('NOT_FOUND')
  })

  it('static assign props check types', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 401 })
    AppError.assign(
      error,
      // @ts-expect-error - code is not match desirecd type
      { code: 'NOT_VALID_CODE' },
    )
  })

  it('static assign props', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 401 })
    const error2 = AppError.assign(error, { code: 'NOT_FOUND' })
    expect(error).toBe(error2)
    expect(error2.status).toBe(401)
    expect(error2.code).toBe('NOT_FOUND')
  })

  // it('form, assing, round, flat, and new, return same type and instance', () => {
  it('form, assing, round, and new, return same type and instance', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const errorNew = new AppError('test', { status: 401 })
    const errorAssign = AppError.assign({}, { status: 401 })
    const errorAssign1 = errorNew.assign({})
    const errorFrom = AppError.from({})
    const errorRound = AppError.round({})
    const errorRound1 = errorNew.round()
    // const errorFlat = AppError.flat({})
    // const errorFlat1 = errorNew.flat()
    expect(errorNew).toBeInstanceOf(AppError)
    expect(errorAssign).toBeInstanceOf(AppError)
    expect(errorAssign1).toBeInstanceOf(AppError)
    expect(errorFrom).toBeInstanceOf(AppError)
    expect(errorRound).toBeInstanceOf(AppError)
    expect(errorRound1).toBeInstanceOf(AppError)
    // expect(errorFlat).toBeInstanceOf(AppError)
    // expect(errorFlat1).toBeInstanceOf(AppError)
    expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorAssign>()
    expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorAssign1>()
    expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorFrom>()
    expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorRound>()
    expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorRound1>()
    // expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorFlat>()
    // expectTypeOf<typeof errorNew>().toEqualTypeOf<typeof errorFlat1>()
  })

  // it.only('flat merge all resolved values to own and remove causes', () => {
  //   const AppError = Error0.use(statusPlugin).use(codePlugin)
  //   const errorDeepDeep = new AppError('test deep deep', { status: 401 })
  //   const errorDeep = new AppError('test deep', { code: 'NOT_FOUND', cause: errorDeepDeep })
  //   const error = new AppError('test', { status: 401, cause: errorDeep })
  //   const flat = error.flat()
  //   expect(flat.own).toEqual({ status: 401, code: 'NOT_FOUND' })
  //   expect(flat.cause).toBeUndefined()
  //   console.error(flat)
  // })

  it('serialize uses identity by default and skips undefined plugin values', () => {
    const AppError = Error0.use(statusPlugin).use('prop', 'code', {
      init: (input: string) => input,
      resolve: ({ flow }) => flow.find(Boolean),
      serialize: () => undefined,
      deserialize: ({ value }) => (typeof value === 'string' ? value : undefined),
    })
    const error = new AppError('test', { status: 401, code: 'secret' })
    const json = AppError.serialize(error)
    expect(json.status).toBe(401)
    expect('code' in json).toBe(false)
  })

  it('serialize keeps stack by default without stack plugin when not public', () => {
    const AppError = Error0.use(statusPlugin)
    const error = new AppError('test', { status: 500 })
    const json = AppError.serialize(error, false)
    expect(json.stack).toBe(error.stack)
  })

  it('serialize does not keep stack when public', () => {
    const AppError = Error0.use(statusPlugin)
    const error = new AppError('test', { status: 500 })
    const json = AppError.serialize(error, true)
    expect('stack' in json).toBe(false)
  })

  it('stack plugin can customize stack serialization without defining prop plugin', () => {
    const AppError = Error0.use('stack', { serialize: ({ value }) => (value ? `custom:${value}` : undefined) })
    const error = new AppError('test')
    const json = AppError.serialize(error)
    expect(typeof json.stack).toBe('string')
    expect((json.stack as string).startsWith('custom:')).toBe(true)
  })

  it('stack plugin can keep default stack via identity function', () => {
    const AppError = Error0.use('stack', { serialize: ({ value }) => value })
    const error = new AppError('test')
    const json = AppError.serialize(error)
    expect(json.stack).toBe(error.stack)
  })

  it('stack plugin can disable stack serialization via function', () => {
    const AppError = Error0.use('stack', { serialize: () => undefined })
    const error = new AppError('test')
    const json = AppError.serialize(error)
    expect('stack' in json).toBe(false)
  })

  it('stack plugin rejects boolean config', () => {
    expect(() => Error0.use('stack', true as any)).toThrow('expects { serialize: function }')
  })

  it('message plugin rejects boolean config', () => {
    expect(() => Error0.use('message', true as any)).toThrow('expects { serialize: function }')
  })

  it('prop("stack") throws and suggests using stack plugin', () => {
    expect(() =>
      Error0.use('prop', 'stack', {
        init: (input: string) => input,
        resolve: ({ own }) => (typeof own === 'string' ? own : undefined),
        serialize: ({ resolved }) => resolved,
        deserialize: ({ value }) => (typeof value === 'string' ? value : undefined),
      }),
    ).toThrow('reserved prop key')
  })

  it('plugin builder also rejects prop("stack") as reserved key', () => {
    expect(() =>
      Error0.plugin().prop('stack', {
        init: (input: string) => input,
        resolve: ({ own }) => (typeof own === 'string' ? own : undefined),
        serialize: ({ resolved }) => resolved,
        deserialize: ({ value }) => (typeof value === 'string' ? value : undefined),
      }),
    ).toThrow('reserved prop key')
  })

  it('prop("message") throws and suggests using message plugin', () => {
    expect(() =>
      Error0.use('prop', 'message', {
        resolve: ({ own }) => own as string,
        serialize: ({ resolved }) => resolved,
        deserialize: ({ value }) => (typeof value === 'string' ? value : undefined),
      }),
    ).toThrow('reserved prop key')
  })

  it('plugin builder also rejects prop("message") as reserved key', () => {
    expect(() =>
      Error0.plugin().prop('message', {
        resolve: ({ own }) => own as string,
        serialize: ({ resolved }) => resolved,
        deserialize: ({ value }) => (typeof value === 'string' ? value : undefined),
      }),
    ).toThrow('reserved prop key')
  })

  it('.serialize() -> .from() roundtrip keeps plugin values', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 409, code: 'NOT_FOUND' })
    const json = AppError.serialize(error, false)
    const recreated = AppError.from(json)
    expect(recreated).toBeInstanceOf(AppError)
    expect(recreated.status).toBe(409)
    expect(recreated.code).toBe('NOT_FOUND')
    expect(AppError.serialize(recreated, false)).toEqual(json)
  })

  it('.round() static and instance do serialize/from roundtrip', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 409, code: 'NOT_FOUND' })
    const roundedStatic = AppError.round(error, false)
    const roundedInstance = error.round(false)

    expect(roundedStatic).toBeInstanceOf(AppError)
    expect(roundedInstance).toBeInstanceOf(AppError)
    expect(roundedStatic.status).toBe(409)
    expect(roundedStatic.code).toBe('NOT_FOUND')
    expect(roundedInstance.status).toBe(409)
    expect(roundedInstance.code).toBe('NOT_FOUND')
    expectTypeOf(roundedStatic.status).toEqualTypeOf<number | undefined>()
    expectTypeOf(roundedStatic.code).toEqualTypeOf<'NOT_FOUND' | 'BAD_REQUEST' | 'UNAUTHORIZED' | undefined>()
    expectTypeOf(roundedInstance.status).toEqualTypeOf<number | undefined>()
    expectTypeOf(roundedInstance.code).toEqualTypeOf<'NOT_FOUND' | 'BAD_REQUEST' | 'UNAUTHORIZED' | undefined>()
  })

  it('.serialize() floated props and not serialize causes', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error1 = new AppError('test', { status: 409 })
    const error2 = new AppError('test', { code: 'NOT_FOUND', cause: error1 })
    const json = AppError.serialize(error2, false)
    expect(json.status).toBe(409)
    expect(json.code).toBe('NOT_FOUND')
    expect('cause' in json).toBe(false)
  })

  it('by default causes not serialized', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 400, code: 'NOT_FOUND' })
    const json = AppError.serialize(error, false)
    expect('cause' in json).toBe(false)
  })

  it('serialize can hide props for public output', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)
    const error = new AppError('test', { status: 401, code: 'NOT_FOUND' })
    const privateJson = AppError.serialize(error, false)
    const publicJson = AppError.serialize(error, true)
    expect(privateJson.code).toBe('NOT_FOUND')
    expect('code' in publicJson).toBe(false)
  })

  it('prop init without input arg infers undefined-only constructor input', () => {
    const AppError = Error0.use('prop', 'computed', {
      init: () => undefined as number | undefined,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number'),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })

    const error = new AppError('test')
    expect(error.computed).toBe(undefined)
    expectTypeOf<typeof error.computed>().toEqualTypeOf<number | undefined>()

    // @ts-expect-error - computed input is disallowed when init has no input arg
    // eslint-disable-next-line no-new
    new AppError('test', { computed: 123 })
  })

  it('prop without init omits constructor input and infers resolve output', () => {
    const AppError = Error0.use('prop', 'statusCode', {
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number'),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })

    const error = new AppError('test')
    expect(error.statusCode).toBe(undefined)
    expectTypeOf<typeof error.statusCode>().toEqualTypeOf<number | undefined>()

    // @ts-expect-error - statusCode input is disallowed when init is omitted
    // eslint-disable-next-line no-new
    new AppError('test', { statusCode: 123 })
  })

  it('prop output type is inferred from resolve type', () => {
    const AppError = Error0.use('prop', 'x', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number') || 500,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })

    const error = new AppError('test')
    expect(error.x).toBe(500)
    expectTypeOf<typeof error.x>().toEqualTypeOf<number>()
    expectTypeOf(AppError.own(error, 'x')).toEqualTypeOf<number | undefined>()
    expectTypeOf(AppError.flow(error, 'x')).toEqualTypeOf<Array<number | undefined>>()

    Error0.plugin().prop('x', {
      init: (input: number) => input,
      // @ts-expect-error - resolve type extends init type
      resolve: ({ flow }) => 'string',
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
  })

  it('own/flow are typed by output type, not resolve type', () => {
    const AppError = Error0.use('prop', 'code', {
      init: (input: number | 'fallback') => input,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number') ?? 500,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' || value === 'fallback' ? value : undefined),
    })
    const error = new AppError('test')

    expect(error.code).toBe(500)
    expect(AppError.own(error, 'code')).toBe(undefined)
    expect(AppError.own(error)).toEqual({ code: undefined })
    expect(error.own).toEqual(undefined)
    expectTypeOf<typeof error.code>().toEqualTypeOf<number>()
    expectTypeOf(AppError.own(error, 'code')).toEqualTypeOf<number | 'fallback' | undefined>()
    expectTypeOf(AppError.own(error)).toEqualTypeOf<{ code: number | 'fallback' | undefined }>()
    expectTypeOf(AppError.flow(error, 'code')).toEqualTypeOf<Array<number | 'fallback' | undefined>>()
  })

  it('own/flow runtime behavior across causes', () => {
    type Code = 'A' | 'B'
    const isCode = (item: unknown): item is Code => item === 'A' || item === 'B'
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number'),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    }).use('prop', 'code', {
      init: (input: Code) => input,
      resolve: ({ flow }) => flow.find(isCode),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (value === 'A' || value === 'B' ? value : undefined),
    })

    const root = new AppError('root', { status: 400, code: 'A' })
    const mid = new AppError('mid', { cause: root })
    const leaf = new AppError('leaf', { status: 500, cause: mid })

    expect(leaf.own).toEqual({ status: 500, code: undefined })
    expect(AppError.own(leaf)).toEqual({ status: 500, code: undefined })
    expect(leaf.flow('status')).toEqual([500, undefined, 400])
    expect(AppError.flow(leaf, 'status')).toEqual([500, undefined, 400])
    expect(leaf.flow('code')).toEqual([undefined, undefined, 'A'])
    expect(AppError.flow(leaf, 'code')).toEqual([undefined, undefined, 'A'])
  })

  it('own/flow have strong types for static and instance methods', () => {
    type Code = 'A' | 'B'
    const isCode = (item: unknown): item is Code => item === 'A' || item === 'B'
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number'),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    }).use('prop', 'code', {
      init: (input: Code) => input,
      resolve: ({ flow }) => flow.find(isCode),
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (value === 'A' || value === 'B' ? value : undefined),
    })

    const error = new AppError('test', { status: 400, code: 'A' })

    expectTypeOf(error.own?.status).toEqualTypeOf<number | undefined>()
    expectTypeOf(error.own?.code).toEqualTypeOf<Code | undefined>()

    expectTypeOf(AppError.own(error, 'status')).toEqualTypeOf<number | undefined>()
    expectTypeOf(AppError.own(error, 'code')).toEqualTypeOf<Code | undefined>()
    expectTypeOf(AppError.own(error)).toEqualTypeOf<{ status: number | undefined; code: Code | undefined }>()
    expectTypeOf(AppError.flow(error, 'status')).toEqualTypeOf<Array<number | undefined>>()
    expectTypeOf(AppError.flow(error, 'code')).toEqualTypeOf<Array<Code | undefined>>()
  })

  it('resolve returns plain resolved props object without methods', () => {
    type Code = 'A' | 'B'
    const isCode = (item: unknown): item is Code => item === 'A' || item === 'B'
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number') ?? 500,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
      .use('prop', 'code', {
        init: (input: Code) => input,
        resolve: ({ flow }) => flow.find(isCode),
        serialize: ({ resolved }) => resolved,
        deserialize: ({ value }) => (value === 'A' || value === 'B' ? value : undefined),
      })
      .use('method', 'isStatus', (error, status: number) => error.status === status)

    const root = new AppError('root', { status: 400, code: 'A' })
    const leaf = new AppError('leaf', { cause: root })

    const resolvedStatic = AppError.resolve(leaf)
    const resolvedInstance = leaf.resolve()
    expect(resolvedStatic).toEqual({ status: 400, code: 'A' })
    expect(resolvedInstance).toEqual({ status: 400, code: 'A' })
    expect('isStatus' in resolvedStatic).toBe(false)
    expect(Object.keys(resolvedInstance)).toEqual(['status', 'code'])

    expectTypeOf(resolvedStatic).toEqualTypeOf<{ status: number; code: Code | undefined }>()
  })

  it('prop resolved type can be not undefined with init not provided', () => {
    const AppError = Error0.use('prop', 'x', {
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number') || 500,
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })

    const error = new AppError('test')
    expect(error.x).toBe(500)
    expectTypeOf<typeof error.x>().toEqualTypeOf<number>()

    Error0.plugin().prop('x', {
      init: (input: number) => input,
      // @ts-expect-error - resolve type extends init type
      resolve: ({ flow }) => 'string',
      serialize: ({ resolved }) => resolved,
      deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
    })
  })

  it('serialize/deserialize can be set to false to disable them', () => {
    const AppError = Error0.use('prop', 'status', {
      init: (input: number) => input,
      resolve: ({ flow }) => flow.find((item) => typeof item === 'number'),
      serialize: false,
      deserialize: false,
    })
    const error = new AppError('test', { status: 401 })
    const json = AppError.serialize(error)
    expect('status' in json).toBe(false)

    const recreated = AppError.from({ ...json, status: 999 })
    expect(recreated.status).toBe(undefined)
  })

  it('by default error0 created from another error has same message', () => {
    const schema = z.object({
      x: z.string(),
    })
    const parseResult = schema.safeParse({ x: 123 })
    const parsedError = parseResult.error
    assert.ok(parsedError)
    const error = Error0.from(parsedError)
    expect(error.message).toBe(parsedError.message)
  })

  it('adapt message and other props via direct transformations', () => {
    const schema = z.object({
      x: z.string(),
    })
    const parseResult = schema.safeParse({ x: 123 })
    const parsedError = parseResult.error
    assert.ok(parsedError)
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use('adapt', (error) => {
        if (error.cause instanceof ZodError) {
          error.status = 422
          error.code = 'NOT_FOUND'
          error.message = `Validation Error: ${error.message}`
        }
      })
    const error = AppError.from(parsedError)
    expect(error.message).toBe(`Validation Error: ${parsedError.message}`)
    expect(error.status).toBe(422)
    expect(error.code).toBe('NOT_FOUND')
    const error1 = new AppError('test', { cause: parsedError })
    expect(error1.message).toBe('Validation Error: test')
    expect(error1.status).toBe(422)
    expect(error1.code).toBe('NOT_FOUND')
  })

  it('adapt message and other props via return output values from plugin', () => {
    const schema = z.object({
      x: z.string(),
    })
    const parseResult = schema.safeParse({ x: 123 })
    const parsedError = parseResult.error
    assert.ok(parsedError)
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use('adapt', (error) => {
        if (error.cause instanceof ZodError) {
          error.message = `Validation Error: ${error.message}`
          return {
            status: 422,
            code: 'NOT_FOUND',
          }
        }
        return undefined
      })
    const error = AppError.from(parsedError)
    expect(error.message).toBe(`Validation Error: ${parsedError.message}`)
    expect(error.status).toBe(422)
    expect(error.code).toBe('NOT_FOUND')
    const error1 = new AppError('test', { cause: parsedError })
    expect(error1.message).toBe('Validation Error: test')
    expect(error1.status).toBe(422)
    expect(error1.code).toBe('NOT_FOUND')
  })

  it('adapt message and other props on error0 itself', () => {
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use('adapt', (error) => {
        if (error.status === 404 && !error.code) {
          error.code = 'NOT_FOUND'
        }
      })
    const error = new AppError('test', { status: 404 })
    expect(error.code).toBe('NOT_FOUND')
  })

  it('messages can be combined on serialization', () => {
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use('message', {
        serialize: ({ error }) =>
          error
            .causes()
            .map((cause) => {
              return cause instanceof Error ? cause.message : undefined
            })
            .filter((value): value is string => typeof value === 'string')
            .join(': '),
      })
    const error1 = new AppError('test1', { status: 400, code: 'NOT_FOUND' })
    const error2 = new AppError({ message: 'test2', status: 401, cause: error1 })
    expect(error1.message).toEqual('test1')
    expect(error2.message).toEqual('test2')
    expect((error2.cause as any)?.message).toEqual('test1')
    expect(error1.serialize().message).toEqual('test1')
    expect(error2.serialize().message).toEqual('test2: test1')
  })

  it('stack plugin can merge stack across causes in one serialized value', () => {
    const AppError = Error0.use(statusPlugin)
      .use(codePlugin)
      .use('stack', {
        serialize: ({ error }) =>
          error
            .causes()
            .map((cause) => {
              return cause instanceof Error ? cause.stack : undefined
            })
            .filter((value): value is string => typeof value === 'string')
            .join('\n'),
      })
    const error1 = new AppError('test1', { status: 400, code: 'NOT_FOUND' })
    const error2 = new AppError('test2', { status: 401, cause: error1 })
    const mergedStack1 = error1.serialize().stack as string
    const mergedStack2 = error2.serialize().stack as string
    expect(mergedStack1).toContain('Error0: test1')
    expect(mergedStack2).toContain('Error0: test2')
    expect(mergedStack2).toContain('Error0: test1')
    expect(fixStack(mergedStack1)).toMatchInlineSnapshot(`
      "Error0: test1
          at <anonymous> (...)"
    `)
    expect(fixStack(mergedStack2)).toMatchInlineSnapshot(`
      "Error0: test2
          at <anonymous> (...)
      Error0: test1
          at <anonymous> (...)"
    `)
  })

  it('stress: resolve/serialize/flow stays within perf budget', () => {
    const AppError = Error0.use(statusPlugin).use(codePlugin)

    let current: InstanceType<typeof AppError> = new AppError('root', {
      status: 500,
      code: 'BAD_REQUEST',
    })
    for (let i = 0; i < 300; i += 1) {
      current = new AppError(`level-${i}`, {
        status: 500,
        code: i % 2 === 0 ? 'NOT_FOUND' : 'BAD_REQUEST',
        cause: current,
      })
    }

    let checksum = 0
    const startedAt = performance.now()
    for (let i = 0; i < 3000; i += 1) {
      const resolved = AppError.resolve(current)
      const serialized = AppError.serialize(current, false)
      const flow = current.flow('status')
      checksum += resolved.status ?? 0
      checksum += (serialized.status as number | undefined) ?? 0
      checksum += flow.length
    }
    const elapsedMs = performance.now() - startedAt
    const budgetMs = process.env.CI ? 8000 : 4000

    expect(checksum).toBeGreaterThan(0)
    expect(elapsedMs).toBeLessThan(budgetMs)
  })

  it('class can be created extended from Error0', () => {
    class MyError extends Error0.use(statusPlugin).use(codePlugin) {
      isStatusAndCode(status: number, code: string): boolean {
        return this.status === status && this.code === code
      }
    }
    const error = new MyError('test', { status: 400, code: 'NOT_FOUND' })
    expect(error.isStatusAndCode(400, 'NOT_FOUND')).toBe(true)
    expect(error.isStatusAndCode(400, 'BAD_REQUEST')).toBe(false)
    expect(error.name).toBe('Error0')
    expectTypeOf<typeof MyError>().toExtend<ClassError0>()
  })

  it('Error0 assignable to LikeError0', () => {
    class MyError extends Error {
      status?: number
      code?: string
      constructor(message: string, options: { cause?: unknown; status?: number; code?: string }) {
        super(message, { cause: options.cause })
        this.status = options.status
        this.code = options.code
      }

      static from(error: unknown): MyError {
        if (error instanceof MyError) {
          return error
        }
        const object = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {}
        const message =
          typeof object.message === 'string' ? object.message : typeof error === 'string' ? error : 'Unknown error'
        const status = typeof object.status === 'number' ? object.status : undefined
        const code = typeof object.code === 'string' ? object.code : undefined
        return new MyError(message, {
          cause: error,
          status,
          code,
        })
      }

      static serialize(error: MyError): Record<string, unknown> {
        return {
          message: error.message,
          status: error.status,
          code: error.code,
        }
      }
    }

    type LikeError0<TError> = {
      new (message: string, options: { cause?: unknown; status?: number; code?: string }): TError
      from: (error: unknown) => TError
      serialize: (error: TError) => Record<string, unknown>
    }
    expectTypeOf<typeof MyError>().toExtend<LikeError0<MyError>>()
    expectTypeOf<typeof Error0>().toExtend<typeof MyError>()
  })

  // we will have no variants
  // becouse you can thorw any errorm and when you do AppError.from(yourError)
  // can use adapt to assign desired props to error, it is enough for transport
  // you even can create computed or method to retrieve your error, so no problems with variants

  // it('can create and recongnize variant', () => {
  //   const AppError = Error0.use(statusPlugin)
  //     .use(codePlugin)
  //     .use('prop', 'userId', {
  //       input: (value: string) => value,
  //       output: (error) => {
  //         for (const value of error.flow('userId')) {
  //           if (typeof value === 'string') {
  //             return value
  //           }
  //         }
  //         return undefined
  //       },
  //       serialize: (value) => value,
  //     })
  //   const UserError = AppError.variant('UserError', {
  //     userId: true,
  //   })
  //   const error = new UserError('test', { userId: '123', status: 400 })
  //   expect(error).toBeInstanceOf(UserError)
  //   expect(error).toBeInstanceOf(AppError)
  //   expect(error).toBeInstanceOf(Error0)
  //   expect(error).toBeInstanceOf(Error)
  //   expect(error.userId).toBe('123')
  //   expect(error.status).toBe(400)
  //   expect(error.code).toBe(undefined)
  //   expectTypeOf<typeof error.userId>().toEqualTypeOf<string>()
  //   // @ts-expect-error
  //   new UserError('test')
  // })
})
