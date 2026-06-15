import { Error0 } from '../index.js'

// A known foreign error type registered with causeVariantsPlugin: error0 recognizes a live one with
// `instanceof` and uses the static trio to round-trip it losslessly through JSON.
type Variant = {
  new (...args: any[]): unknown
  [Symbol.hasInstance]: (value: any) => boolean
  isSerialized: (serializedCause: any) => boolean
  serialize: (error: any) => unknown
  from: (error: any) => unknown
}

type Transport = 'public' | 'private' | 'none'

// EXPERIMENTAL — may change or be dropped; kept fully separate from the core `causePlugin` on
// purpose, so the default cause handling never carries this. It does what causePlugin does (gate by
// `transport`, rebuild nested Error0s, keep foreign errors as { name, message, stack } and walk
// their chains, cycle + depth guarded), and adds typed round-trip for KNOWN foreign types: register
// classes in `variants` (each needs `serialize`/`from`/`isSerialized` statics and a working
// `instanceof`). A matched variant round-trips through its own hooks; anything else falls back to
// the same generic handling. The standalone duplication of the chain walk is intentional — this
// module stays independent of `causePlugin` rather than coupling the core to an experiment.
export const causeVariantsPlugin = <TVariants extends Record<string, Variant> = Record<never, Variant>>({
  transport = 'private',
  variants,
}: { transport?: Transport; variants?: TVariants } = {}) =>
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
