import { Error0 } from '../index.js'

/**
 * A typed `level` field an error carries about itself — its own opinion of how severe it is, independent of how the
 * code happens to report it. A logger can read `error.level` and honor it: e.g. downgrade a `logger.error(err)` call to
 * a `warn` line when the error was constructed with `level: 'warn'`.
 *
 * Pass `levels` **ordered most-dangerous first** (e.g. `['fatal', 'error', 'warn', 'info']`) — that order _defines_ the
 * severity scale, and error0 stays agnostic of any specific set (match your logger's vocabulary). Across a cause chain
 * the **most dangerous** level present wins, so a severe cause is never masked by a milder wrapper (nor a mild cause
 * downgraded by a severe wrapper — severity, not proximity, decides). With no `levels` there is no scale, so the
 * nearest-set value wins instead. `transport` controls whether it crosses the wire (default `private`, server-only);
 * values outside `levels` are dropped on deserialize.
 */
export const levelPlugin = <TLevel extends string>({
  levels,
  transport = 'private',
}: { levels?: TLevel[]; transport?: 'public' | 'private' | 'none' } = {}) => {
  const isLevel = (value: unknown): value is TLevel =>
    typeof value === 'string' && (!levels || levels.includes(value as TLevel))
  return Error0.plugin().prop('level', {
    init: (level: TLevel) => level,
    resolve: ({ flow }) => {
      const present = flow.filter(isLevel)
      if (present.length === 0) {
        return undefined
      }
      // No scale to compare on → nearest-set wins (flow is nearest-first). Otherwise the most dangerous across the
      // whole chain wins: `levels` is most-dangerous-first, so the smallest index is the severest.
      if (!levels) {
        return present[0]
      }
      return present.reduce((most, current) => (levels.indexOf(current) < levels.indexOf(most) ? current : most))
    },
    serialize: ({ resolved, isPublic }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      return resolved
    },
    deserialize: ({ value }) => (isLevel(value) ? value : undefined),
  })
}
