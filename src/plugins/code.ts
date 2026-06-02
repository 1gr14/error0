import { Error0 } from '../index.js'

export const codePlugin = <TCode extends string>({
  codes,
  isPublic = false,
}: { codes?: TCode[]; isPublic?: boolean } = {}) => {
  const isCode = (value: unknown): value is TCode =>
    typeof value === 'string' && (!codes || codes.includes(value as TCode))
  return Error0.plugin().prop('code', {
    init: (code: TCode) => code,
    resolve: ({ flow }) => flow.find(Boolean),
    serialize: ({ resolved, isPublic: _isPublic }) => {
      if (!isPublic && _isPublic) {
        return undefined
      }
      return resolved
    },
    deserialize: ({ value }) => (isCode(value) ? value : undefined),
  })
}
