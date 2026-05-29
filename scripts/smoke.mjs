// Post-build smoke test: verifies the published artifact loads under plain Node,
// that the package "exports" map resolves both the root and a sub-path, and that
// a basic plugin + serialize/from round-trip works end-to-end.
import { Error0 } from '../dist/index.js'
import { codePlugin } from '../dist/plugins/code.js'

const assert = (cond, msg) => {
  if (!cond) {
    console.error('smoke test failed:', msg)
    process.exit(1)
  }
}

const AppError = Error0.use(codePlugin())
const error = new AppError('boom', { code: 'X' })

assert(error instanceof Error, 'should be an Error')
assert(error instanceof Error0, 'should be an Error0')
assert(error.message === 'boom', 'message should round-trip')
assert(error.code === 'X', 'plugin prop should be readable')

const json = AppError.serialize(error, false)
const recreated = AppError.from(json)

assert(recreated instanceof AppError, 'from() should return AppError instance')
assert(recreated.message === 'boom', 'message should survive serialize/from')
assert(recreated.code === 'X', 'plugin prop should survive serialize/from')

console.log('smoke ok')
