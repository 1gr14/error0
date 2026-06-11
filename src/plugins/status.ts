import { Error0 } from '../index.js'

export const statusPlugin = <TStatuses extends Record<string, number> = Record<never, number>>({
  transport = 'private',
  statuses,
  strict = false,
}: { transport?: 'public' | 'private' | 'none'; statuses?: TStatuses; strict?: boolean } = {}) => {
  const statusValues = statuses ? Object.values(statuses) : undefined
  const isStatusValue = (value: unknown): value is number =>
    typeof value === 'number' && (!statusValues || !strict || statusValues.includes(value))
  const normalizeStatusValue = (value: unknown): number | undefined => {
    return isStatusValue(value) ? value : undefined
  }
  const convertStatusValue = (value: number | string): number | undefined => {
    if (typeof value === 'number') {
      return normalizeStatusValue(value)
    }
    if (statuses && value in statuses) {
      return statuses[value as keyof TStatuses]
    }
    return undefined
  }

  return Error0.plugin().prop('status', {
    init: (status: number | Extract<keyof TStatuses, string>) => convertStatusValue(status),
    resolve: ({ flow }) => flow.find(Boolean),
    serialize: ({ resolved, isPublic }) => {
      if (transport === 'none' || (transport === 'private' && isPublic)) {
        return undefined
      }
      return resolved
    },
    deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
  })
}
