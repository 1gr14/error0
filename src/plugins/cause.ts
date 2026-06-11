import { Error0 } from '../index.js'

type Variant = {
  new (...args: any[]): unknown
  [Symbol.hasInstance]: (value: any) => boolean
  isSerialized: (serializedCause: any) => boolean
  serialize: (error: any) => unknown
  from: (error: any) => unknown
}

export const causePlugin = <TVariants extends Record<string, Variant> = Record<never, Variant>>({
  transport = 'private',
  variants = undefined,
}: { transport?: 'public' | 'private' | 'none'; variants?: TVariants } = {}) =>
  Error0.plugin().cause({
    serialize: ({ cause, isPublic, is, serialize }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      const seen = new Set<unknown>()
      const serializeChain = (value: unknown, depth: number): unknown => {
        if (value === undefined || value === null || depth > Error0.MAX_CAUSES_DEPTH || seen.has(value)) {
          return undefined
        }
        seen.add(value)
        if (variants) {
          for (const variant of Object.values(variants)) {
            if (value instanceof variant) {
              return variant.serialize(value)
            }
          }
        }
        if (is(value)) {
          return serialize(value)
        }
        // A foreign Error (e.g. a ZodError) must not vanish from the private output — keep its
        // identity and stack verbatim and walk its own cause chain.
        if (value instanceof Error) {
          const record: Record<string, unknown> = { name: value.name, message: value.message }
          if (value.stack) {
            record.stack = value.stack
          }
          const nested = serializeChain((value as { cause?: unknown }).cause, depth + 1)
          if (nested !== undefined) {
            record.cause = nested
          }
          return record
        }
        return undefined
      }
      return serializeChain(cause, 0)
    },
    deserialize: ({ cause, fromSerialized, isSerialized }) => {
      if (variants) {
        for (const variant of Object.values(variants)) {
          if (variant.isSerialized(cause)) {
            return variant.from(cause)
          }
        }
      }
      if (isSerialized(cause)) {
        return fromSerialized(cause)
      }
      return cause
    },
  })
