import { describe, expect, it } from 'bun:test'
import { Error0 } from './index.js'
import { causePlugin } from './plugins/cause.js'
import { codeStatusPlugin } from './plugins/code-status.js'
import { expectedPlugin } from './plugins/expected.js'
import { flatOriginalPlugin } from './plugins/flat-original.js'
import { metaPlugin } from './plugins/meta.js'

// A zod-like foreign error: an Error subclass (so flatOriginalPlugin skips it) whose message is a
// JSON blob with braces — the exact shape of the 2026-06-10 incident.
class FakeZodError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ZodError'
  }
}

const zodMessage = `[
  {
    "code": "invalid_type",
    "expected": "object",
    "path": ["schema"]
  }
]`

// Mirrors the start0/site AppError assembly.
const buildAppError = () =>
  Error0.mark('AppError')
    .use(codeStatusPlugin({ codes: { UNAUTHORIZED: 401, FORBIDDEN: 403 }, transport: 'public' }))
    .use(metaPlugin())
    .use(flatOriginalPlugin())
    .use(expectedPlugin())
    .use(causePlugin())

describe('name', () => {
  it('a string mark becomes the instance name', () => {
    const AppError = buildAppError()
    const error = new AppError('boom')
    expect(error.name).toBe('AppError')
    expect(String(error)).toBe('AppError: boom')
  })

  it('unmarked Error0 keeps the Error0 name', () => {
    expect(new Error0('boom').name).toBe('Error0')
  })

  it('does not serialize its own name, public or private', () => {
    const AppError = buildAppError()
    const error = new AppError('boom')
    expect(error.serialize(true).name).toBeUndefined()
    expect(error.serialize(false).name).toBeUndefined()
  })

  it('rebuilds the name from the class on round-trip, not from the payload', () => {
    const AppError = buildAppError()
    const error = new AppError('boom', { code: 'UNAUTHORIZED' })
    const json = error.serialize(false)
    expect(json.name).toBeUndefined() // an Error0's name never crosses the wire
    const recreated = AppError.from(json)
    expect(recreated).toBeInstanceOf(AppError)
    expect(recreated.name).toBe('AppError') // re-derived from the AppError mark
    expect(recreated.message).toBe('boom')
    expect(recreated.code).toBe('UNAUTHORIZED')
  })
})

describe('serializePublic / serializePrivate', () => {
  it('instance methods are sugar over serialize(true / false)', () => {
    const AppError = buildAppError()
    const error = new AppError('boom', { code: 'FORBIDDEN', meta: { userId: 1 } })
    expect(error.serializePublic()).toEqual(error.serialize(true))
    expect(error.serializePrivate()).toEqual(error.serialize(false))
  })

  it('statics accept anything from-able', () => {
    const AppError = buildAppError()
    const json = AppError.serializePrivate(new FakeZodError(zodMessage))
    expect(json.name).toBeUndefined()
    expect(json.message).toBe(zodMessage)
    expect(typeof json.stack).toBe('string')
  })
})

describe('incident 2026-06-10: a foreign cause must survive private serialization', () => {
  it('private output carries the full identity of a ZodError-like cause', () => {
    const AppError = buildAppError()
    const zodError = new FakeZodError(zodMessage)
    const wrapped = AppError.from(zodError)
    const json = wrapped.serializePrivate()

    expect(json.name).toBeUndefined()
    expect(json.message).toBe(zodMessage)
    expect(typeof json.stack).toBe('string')
    expect(json.expected).toBe(false)

    const cause = json.cause as Record<string, unknown>
    expect(cause).toBeDefined()
    expect(cause.name).toBe('ZodError')
    expect(cause.message).toBe(zodMessage)
    expect(cause.stack).toBe(zodError.stack)
  })

  it('public output hides stack, cause, meta and expected; carries code and status', () => {
    const AppError = buildAppError()
    const error = new AppError('Sign in to continue', {
      code: 'UNAUTHORIZED',
      meta: { userId: 1 },
      cause: new FakeZodError(zodMessage),
    })
    const json = error.serializePublic()

    expect(json.code).toBe('UNAUTHORIZED')
    expect(json.status).toBe(401)
    expect(json.stack).toBeUndefined()
    expect(json.cause).toBeUndefined()
    expect(json.meta).toBeUndefined()
    expect(json.expected).toBeUndefined()
  })

  it('private output keeps meta and expected', () => {
    const AppError = buildAppError()
    const error = new AppError('boom', { meta: { userId: 1 }, expected: true })
    const json = error.serializePrivate()
    expect(json.meta).toEqual({ userId: 1 })
    expect(json.expected).toBe(true)
  })

  it("transport: 'none' drops the field from both outputs", () => {
    const AppError = Error0.mark('AppError').use(expectedPlugin({ transport: 'none' }))
    const error = new AppError('boom', { expected: true })
    expect(error.serializePublic().expected).toBeUndefined()
    expect(error.serializePrivate().expected).toBeUndefined()
    expect(error.expected).toBe(true) // runtime value untouched
  })

  it('walks a mixed foreign chain and keeps nested identities', () => {
    const AppError = buildAppError()
    const root = new FakeZodError('root zod failure')
    const middle = new FakeZodError(zodMessage, { cause: root })
    const error = new AppError('init failed', { cause: middle })
    const json = error.serializePrivate()

    const cause = json.cause as Record<string, unknown>
    expect(cause.name).toBe('ZodError')
    expect(cause.message).toBe(zodMessage)
    const nested = cause.cause as Record<string, unknown>
    expect(nested.name).toBe('ZodError')
    expect(nested.message).toBe('root zod failure')
    expect(nested.stack).toBe(root.stack)
  })

  it('serializes an Error0 found inside a foreign chain', () => {
    const AppError = buildAppError()
    const inner = new AppError('inner', { code: 'FORBIDDEN' })
    const foreign = new FakeZodError(zodMessage, { cause: inner })
    const error = new AppError('outer', { cause: foreign })
    const json = error.serializePrivate()

    const cause = json.cause as Record<string, unknown>
    expect(cause.name).toBe('ZodError') // foreign link keeps its name — it's the only identity it has
    const nested = cause.cause as Record<string, unknown>
    expect(nested.name).toBeUndefined() // the inner AppError is an Error0 — identified by its fields, not a name
    expect(nested.message).toBe('inner')
    expect(nested.code).toBe('FORBIDDEN')
  })

  it('survives a cause cycle', () => {
    const AppError = buildAppError()
    // Subclassed errors so flatOriginalPlugin does not flatten the first link away.
    const a = new FakeZodError('a')
    const b = new FakeZodError('b')
    a.cause = b
    b.cause = a
    const error = new AppError('cyclic', { cause: a })
    const json = error.serializePrivate()

    const cause = json.cause as Record<string, unknown>
    expect(cause.message).toBe('a')
    const nested = cause.cause as Record<string, unknown>
    expect(nested.message).toBe('b')
    // The cycle stops here instead of recursing forever.
    expect(nested.cause).toBeUndefined()
  })
})
