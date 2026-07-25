import { describe, expect, it } from 'bun:test'
import { Error0 } from '../index.js'
import { preventRetryPlugin } from './prevent-retry.js'

describe('preventRetryPlugin', () => {
  it('carries the flag and resolves undefined when nobody set it', () => {
    const AppError = Error0.use(preventRetryPlugin())
    expect(new AppError('blocked', { preventRetry: true }).preventRetry).toBe(true)
    expect(new AppError('retryable', { preventRetry: false }).preventRetry).toBe(false)
    expect(new AppError('unset').preventRetry).toBe(undefined)
  })

  it('the first boolean in the flow chain wins — an outer wrap overrides an inner verdict', () => {
    const AppError = Error0.use(preventRetryPlugin())
    const inner = new AppError('denied', { preventRetry: true })
    const lifted = new AppError('wrapped', { preventRetry: false, cause: inner })
    const inherited = new AppError('wrapped', { cause: inner })
    expect(lifted.preventRetry).toBe(false)
    expect(inherited.preventRetry).toBe(true)
  })

  it('serializes only a resolved true, in the public and the private shape alike', () => {
    const AppError = Error0.use(preventRetryPlugin())
    const blocked = new AppError('denied', { preventRetry: true })
    const lifted = new AppError('wrapped', { preventRetry: false, cause: blocked })
    const unset = new AppError('unset')
    expect((blocked.serializePublic() as { preventRetry?: boolean }).preventRetry).toBe(true)
    expect((blocked.serializePrivate() as { preventRetry?: boolean }).preventRetry).toBe(true)
    expect('preventRetry' in (lifted.serializePublic() as object)).toBe(false)
    expect('preventRetry' in (unset.serializePublic() as object)).toBe(false)
  })

  it('round-trips the wire: a serialized true deserializes back to a blocking error', () => {
    const AppError = Error0.use(preventRetryPlugin())
    const wire = new AppError('denied', { preventRetry: true }).serializePublic()
    const revived = AppError.from(wire)
    expect(revived.preventRetry).toBe(true)
  })

  it('transport none/private hide the flag from the respective shapes', () => {
    const NoneError = Error0.use(preventRetryPlugin({ transport: 'none' }))
    const PrivateError = Error0.use(preventRetryPlugin({ transport: 'private' }))
    const none = new NoneError('denied', { preventRetry: true })
    const priv = new PrivateError('denied', { preventRetry: true })
    expect('preventRetry' in (none.serializePublic() as object)).toBe(false)
    expect('preventRetry' in (none.serializePrivate() as object)).toBe(false)
    expect('preventRetry' in (priv.serializePublic() as object)).toBe(false)
    expect((priv.serializePrivate() as { preventRetry?: boolean }).preventRetry).toBe(true)
  })
})
