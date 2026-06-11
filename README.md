# @1gr14/error0

> One typed, serializable `Error` class for errors that travel across your app.

[![CI](https://github.com/1gr14/error0/actions/workflows/ci.yml/badge.svg)](https://github.com/1gr14/error0/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@1gr14/error0.svg)](https://www.npmjs.com/package/@1gr14/error0)
[![coverage](https://codecov.io/gh/1gr14/error0/branch/main/graph/badge.svg)](https://codecov.io/gh/1gr14/error0)
[![gzip](https://deno.bundlejs.com/badge?q=@1gr14/error0)](https://bundlejs.com/?q=@1gr14/error0)
[![license](https://img.shields.io/npm/l/@1gr14/error0.svg)](./LICENSE)

<!-- docs:start -->

Errors travel. You throw in one layer and catch in another. Sometimes it's your
error, sometimes a native `Error`, sometimes an Axios or Zod error, sometimes
just a string. `error0` turns any of them into one typed class you control. You
attach typed fields with small plugins, those fields **flow** up through cause
chains, and the whole error **serializes** to JSON and back — so it survives a
trip across a process, a queue, or the network.

```ts
import { Error0 } from '@1gr14/error0'
import { statusPlugin } from '@1gr14/error0/plugins/status'
import { codePlugin } from '@1gr14/error0/plugins/code'
import { metaPlugin } from '@1gr14/error0/plugins/meta'
import { causePlugin } from '@1gr14/error0/plugins/cause'
import { stackPlugin } from '@1gr14/error0/plugins/stack'
import { responsePlugin } from '@1gr14/error0/plugins/response'
import { redirectPlugin } from '@1gr14/error0/plugins/point0-redirect'
import { flatOriginalPlugin } from '@1gr14/error0/plugins/flat-original'
import { expectedPlugin } from '@1gr14/error0/plugins/expected'

// One error class for your whole app — compose built-in plugins and your own.
export const AppError = Error0.mark('AppError')
  .use(statusPlugin({ transport: 'public' }))
  .use(
    codePlugin({ codes: ['UNAUTHORIZED', 'FORBIDDEN'], transport: 'public' }),
  )
  .use(metaPlugin()) // private — lands in serializePrivate() only
  .use(causePlugin()) // the cause chain (Zod, Axios, ...) survives serializePrivate()
  .use(stackPlugin()) // the stack policy, explicit: private by default
  .use(responsePlugin())
  .use(redirectPlugin())
  .use(flatOriginalPlugin())
  .use(expectedPlugin())
  .use(betterAuthErrorPlugin) // ← your own plugin, composed like the rest

// build errors with typed fields
const inner = new AppError('Token expired', {
  status: 401,
  code: 'UNAUTHORIZED',
})

// stack them — wrap a cause, and fields flow up the chain
const outer = new AppError('Request failed', { cause: inner })
outer.status // 401  ← flowed up from the inner cause
outer.flow('status') // [undefined, 401]  — the value at each level of the chain

// coerce anything at a boundary, then serialize a client-safe payload
const json = AppError.serializePublic(outer) // public fields only; no stack, no meta

// ...and rebuild a real AppError on the other side
const restored = AppError.from(json)
restored.status // 401  ← survived the round-trip
restored.code // 'UNAUTHORIZED'
```

## Install

```sh
bun add @1gr14/error0
# or: npm install / pnpm add / yarn add
```

Bun 1+ or Node.js 20+. ESM only.

## Any error becomes your error

Start here, because this is the problem `error0` was built for. You catch an
`unknown`. You want a typed error you can trust. `Error0.from()` gives you one,
every time:

```ts
import { Error0 } from '@1gr14/error0'

Error0.from(new Error('boom')) // wraps the native error, keeps it as `cause`
Error0.from('boom') // wraps the string
Error0.from({ message: 'boom' }) // rebuilds from a serialized object
Error0.from(error0Instance) // already an Error0 → returned as-is

try {
  await doStuff()
} catch (e) {
  throw Error0.from(e) // always an Error0, original preserved as `cause`
}
```

`Error0` is a real subclass of `Error`, so everything you expect still works:

```ts
const err = new Error0('nope')
err instanceof Error0 // true
err instanceof Error // true
err.message // "nope"
err.stack // present
```

## Prefer one error class

You usually want a single `AppError` for the whole app — not a `DbError`,
`ApiError`, `ValidationError` zoo. Model the differences as **fields**, not
classes. A field can hold anything — a whole object, not just a primitive — and
you choose whether it crosses the wire.

```ts
// Don't reach for a separate DbError — add a field holding the raw driver error
const AppError = Error0.use('prop', 'dbError', {
  init: (error: PostgresError) => error, // the input can be a whole object
  resolve: ({ flow }) => flow.find(Boolean),
  serialize: false, // keep it server-side; never send it to a client
  deserialize: false,
})

const err = new AppError('Query failed', { dbError: pgError })
err.dbError // the full driver error, typed — for your logs
AppError.serialize(err) // { name, message } — `dbError` never crosses the wire
```

One class to catch, one `is()`, one serialize contract — every concern lives as
a typed field on it. The next sections show how fields work.

## Give your errors typed fields

A bare message isn't enough. You want an HTTP status, a code, whatever your app
needs. Add a field with `.use('prop', ...)`. A field is four small functions,
and each one exists for a reason:

```ts
const AppError = Error0.use('prop', 'status', {
  // init: declares the input type (here: number); can also transform it
  init: (input: number) => input,
  // resolve: builds err.status from `flow` (this error's value + all causes')
  resolve: ({ flow }) => flow.find(Boolean),
  // serialize: turn the value into JSON
  serialize: ({ resolved }) => resolved,
  // deserialize: read the value back when rebuilding from JSON
  deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
})

const err = new AppError('User not found', { status: 404 })
err.status // 404  ← typed as number | undefined
```

- **`init`** mainly declares the input type. Writing `(input: number)` is what
  makes `new AppError('...', { status })` expect a number. You can transform
  here too (a status name → a number), but typing the input is the point.
- **`resolve`** decides what `err.status` returns. `flow` is the array of values
  down the cause chain — this error's own value plus every cause's, nearest
  first. `flow.find(Boolean)` means "the first one anyone set". More on this in
  the next section.
- **`serialize`** / **`deserialize`** are the two ends of the JSON boundary. No
  field crosses the wire without them.

Every field is optional on input. Even typed `number`, `status` can always be
left out — it's then `undefined`. That convention is the trick behind
`Error0.from()`: since no field is ever required, _any_ error can become an
`Error0`.

`message` and `stack` are reserved — adding them as props throws. To change how
they serialize, use their own hooks: `.use('message', { serialize })` and
`.use('stack', { serialize })` (the bundled `stackPlugin`, `messageMergePlugin`,
and `stackMergePlugin` are built on these).

## Fields flow through cause chains

Here's why `resolve` takes a `flow`. When you wrap an error, the inner error's
status shouldn't vanish. `flow` is this error's value plus every cause's value,
nearest first — so `flow.find(Boolean)` means "the first status anyone set":

```ts
const inner = new AppError('DB unreachable', { status: 503 })
const outer = new AppError('Could not load user', { cause: inner })

outer.status // 503  ← flowed up from `inner`
outer.flow('status') // [undefined, 503]
Error0.causes(outer, true) // [outer, inner] — the Error0 links in the chain
```

You decide the rule. Omit `resolve` (or `resolve: false`) and `err.status` is
just this error's own value, ignoring causes. Return `500` and every error
reports `500`. The flow is yours to shape.

## Add methods

Fields are data. You'll also want behavior — a question you ask an error often.
Add a method:

```ts
const AppError = Error0.use('prop', 'status', {
  init: (input: number) => input,
  resolve: ({ flow }) => flow.find(Boolean),
  serialize: ({ resolved }) => resolved,
  deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
}).use(
  'method',
  'isStatus',
  (error, expected: number) => error.status === expected,
)

const err = new AppError('Forbidden', { status: 403 })
err.isStatus(403) // true

// every method is also a static that runs `from()` on its first argument —
// so it works on anything: an AppError, a serialized object, or a native error
AppError.isStatus(err, 403) // true
```

## Adapt errors at construction

An `adapt` hook runs on every new error — including the ones `from()` builds out
of foreign errors. It gets the live error, so it can read the `cause`,
**return** fields to set them, and **mutate** native parts like `message`
directly. This is where you teach `Error0` to understand the rest of the world.

Default an unknown wrap to 500:

```ts
const ServerError = AppError.use('adapt', (error) => {
  // a native Error came in with no status → treat it as a server fault
  if (error.cause instanceof Error && error.status === undefined) {
    return { status: 500 } // returned fields are assigned to the error
  }
})

ServerError.from(new Error('socket hang up')).status // 500
```

Turn a `ZodError` into a clean 422 — status from the return value, message from
the error's first issue:

```ts
import { z } from 'zod'

const ApiError = AppError.use('adapt', (error) => {
  if (error.cause instanceof z.ZodError) {
    // mutate `message` to rewrite it; return fields to set them
    error.message = error.cause.issues[0]?.message ?? error.message
    return { status: 422 }
  }
})

const err = ApiError.from(zodError) // a ZodError you caught upstream
err.message // 'Invalid email address'  ← first Zod issue
err.status // 422
```

Two levers, both shown above: **return** an object to set typed fields, and
**mutate** the error for its native parts (`message`, `stack`).

## Package fields into reusable plugins

Defining `status` inline once is fine. Defining it in every service is not. Wrap
it in a plugin with `Error0.plugin()` and reuse it everywhere:

```ts
export const statusPlugin = () =>
  Error0.plugin().prop('status', {
    init: (input: number) => input,
    resolve: ({ flow }) => flow.find(Boolean),
    serialize: ({ resolved }) => resolved,
    deserialize: ({ value }) => (typeof value === 'number' ? value : undefined),
  })

const AppError = Error0.use(statusPlugin())
```

Each `.use(...)` returns a new class with the previous fields plus the new ones,
all typed. Stack as many as you like:

```ts
const AppError = Error0.use(statusPlugin()).use(codePlugin())
const ApiError = AppError.use(tagsPlugin()) // keeps status + code, adds tags
```

## Batteries included

The common fields are already written. Import only what you use, from
`@1gr14/error0/plugins/*`:

```ts
import { Error0 } from '@1gr14/error0'
import { statusPlugin } from '@1gr14/error0/plugins/status'
import { codePlugin } from '@1gr14/error0/plugins/code'
import { tagsPlugin } from '@1gr14/error0/plugins/tags'

const AppError = Error0.use(statusPlugin())
  .use(codePlugin({ codes: ['NOT_FOUND', 'BAD_REQUEST'] as const }))
  .use(tagsPlugin({ tags: ['retryable', 'user-error'] as const }))

const err = new AppError('User not found', {
  status: 404,
  code: 'NOT_FOUND', // typed: only the codes you listed
  tags: ['user-error'], // typed: only the tags you listed
})

err.hasTag('user-error') // true  ← method from tagsPlugin
```

| Plugin                                               | Adds                                | What it does                                                        |
| ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| [`statusPlugin`](src/plugins/status.ts)              | `status: number`                    | HTTP-style status, with optional enum and strict mode.              |
| [`codePlugin`](src/plugins/code.ts)                  | `code: string`                      | Machine-readable code, with an optional whitelist.                  |
| [`codeStatusPlugin`](src/plugins/code-status.ts)     | `code: string`, `status: number`    | Both in one: a `{ CODE: status }` map auto-fills the status.        |
| [`tagsPlugin`](src/plugins/tags.ts)                  | `tags: string[]`, `hasTag()`        | Dedup'd tags merged across the cause chain.                         |
| [`metaPlugin`](src/plugins/meta.ts)                  | `meta: Record<string, unknown>`     | JSON-safe metadata, merged across causes (nearest wins).            |
| [`expectedPlugin`](src/plugins/expected.ts)          | `expected: boolean`, `isExpected()` | Flag errors that aren't bugs, so you don't log them as such.        |
| [`causePlugin`](src/plugins/cause.ts)                | cause serialization                 | Round-trip non-`Error0` causes (Zod, Axios, your classes).          |
| [`headersPlugin`](src/plugins/headers.ts)            | `headers: Record<string, string>`   | Merge HTTP headers from the cause chain (not serialized).           |
| [`responsePlugin`](src/plugins/response.ts)          | `response: Response`                | Attach a `Response` object (not serialized).                        |
| [`stackPlugin`](src/plugins/stack.ts)                | stack policy on serialize           | The default stack gate as a plugin — `transport` picks who sees it. |
| [`messageMergePlugin`](src/plugins/message-merge.ts) | merged message on serialize         | Join the message chain when serializing.                            |
| [`stackMergePlugin`](src/plugins/stack-merge.ts)     | merged stack on serialize           | Join the stack chain when serializing.                              |
| [`flatOriginalPlugin`](src/plugins/flat-original.ts) | adapt hook                          | Unwrap a native `Error` cause — adopt its message and stack.        |
| [`redirectPlugin`](src/plugins/point0-redirect.ts)   | `redirect`                          | Attach a navigation redirect (for `point0`).                        |

## Send an error across the wire

This is the payoff. Serialize to plain JSON, ship it anywhere, rebuild a real
typed error on the other side:

```ts
const err = new AppError('User not found', { status: 404, code: 'NOT_FOUND' })

const json = err.serializePrivate() // full object, safe to JSON.stringify
const back = AppError.from(json) // a real AppError again

back instanceof AppError // true
back.status // 404
back.code // 'NOT_FOUND'
```

### Public vs private

Some fields are for your logs, not your users. The two audiences have named
methods: `serializePublic()` is what an untrusted client may see;
`serializePrivate()` is the full view for trusted consumers — logs, dev tooling.
Both are thin sugar over `serialize(isPublic)`:

```ts
const AppError = Error0.use(statusPlugin({ transport: 'public' })) // visible to clients
  .use(codePlugin()) // transport: 'private' by default

const err = new AppError('Nope', { status: 403, code: 'FORBIDDEN' })

err.serializePublic() // { name, message, status }   ← no code, no stack
err.serializePrivate() // { name, message, status, code, stack }
```

Send `err.serializePublic()` to the browser, log `err.serializePrivate()` on the
server.

Every bundled plugin takes the same `transport` option: `'public'` — the field
is in both outputs; `'private'` — only in `serializePrivate()`; `'none'` — never
serialized at all.

There's no magic here — it's the field's own `serialize`. The function gets a
call-time `isPublic` flag and decides what to return. Return a value and the
field lands in the JSON; return `undefined` and it's dropped entirely. Here's
the exact gate every bundled plugin uses:

```ts
// inside statusPlugin({ transport })  ← 'public' | 'private' | 'none', the plugin option
serialize: ({ resolved, isPublic }) => {
  // never serialized, or private on a public call → hide it
  if (transport === 'none' || (transport === 'private' && isPublic))
    return undefined
  return resolved // otherwise, put the value in the JSON
}
```

So the `transport` option is just the default for that gate. Write your own
`serialize` and you decide exactly what crosses the wire — mask a value, round
it, or drop it.

<!-- Hidden for now — restore when ready.
### Causes that aren't Error0 (Zod, Axios, ...)

By default a cause isn't serialized — it can't always survive JSON.
`causePlugin` fixes that, and lets you round-trip foreign error types through
`variants`:

```ts
import { causePlugin } from '@1gr14/error0/plugins/cause'

const AppError = Error0.use(causePlugin())
// now `serialize(false)` includes the cause, and `from()` rebuilds it
```
-->

## Recognize your errors with `is` (and `mark`)

One `AppError` is usually enough — model the rest as fields (see
[Prefer one error class](#prefer-one-error-class)). But if you do split into
several classes, `is()` tells them apart, and narrows the type inside the
branch:

```ts
const ApiError = Error0.use(statusPlugin())
const DbError = Error0.use(codePlugin())

try {
  await handler()
} catch (e) {
  if (ApiError.is(e)) {
    e.status // typed — `e` is an ApiError here
  } else if (DbError.is(e)) {
    e.code // typed — `e` is a DbError here
  }
}
```

`is()` checks `instanceof` under the hood, so distinct classes stay distinct —
no setup needed. (Still, prefer one error class per project; reach for more only
when it genuinely helps.)

### When `instanceof` isn't enough — `mark`

`instanceof` breaks when the same class ships in two bundles (a server build and
a client build, say) — the two copies are different classes. `mark` brands a
class with a stable id that `is()` checks instead of the prototype chain, so
recognition survives that boundary:

```ts
const ApiError = Error0.mark('myapp/api').use(statusPlugin())

ApiError.is(err) // matched by brand, even where `instanceof` would fail
```

Use a **string** or a **`Symbol.for('...')`** as the mark — both are stable
across bundles. Never a plain `Symbol('...')`: it's unique per bundle. Give
several classes the same mark and `is()` treats them as one family.

## Better stack traces in dev

Bundlers (Vite, tsx, esbuild) rewrite your code, so stack traces point at
compiled output instead of your source. `error0` calls an optional global hook
on every error and each of its causes at construction, so a tool can remap the
stack. It's a no-op when `NODE_ENV === 'production'`.

Wire it once — for example, with Vite's SSR fixer:

```ts
// dev setup only
globalThis.__ERROR0_FIX_STACKTRACE__ = (error) =>
  viteDevServer.ssrFixStacktrace(error)
```

Now every `Error0`, and each error in its `cause` chain, gets readable,
source-mapped stack traces in development.

## API reference

### Static

| Call                                 | Result                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `Error0.use(plugin)`                 | Extend with a plugin builder.                                                          |
| `Error0.use('prop', key, options)`   | Add one typed field.                                                                   |
| `Error0.use('method', key, fn)`      | Add an instance method.                                                                |
| `Error0.use('adapt', fn)`            | Run a function on every new error.                                                     |
| `Error0.plugin()`                    | Start a plugin builder.                                                                |
| `Error0.from(unknown)`               | Coerce anything into an `Error0` instance.                                             |
| `Error0.is(unknown)`                 | Type guard for this class.                                                             |
| `Error0.serialize(error, isPublic?)` | Serialize to a plain object (public by default).                                       |
| `Error0.serializePublic(error)`      | What an untrusted client may see.                                                      |
| `Error0.serializePrivate(error)`     | The full view — for logs and dev tooling.                                              |
| `Error0.round(error, isPublic?)`     | `from(serialize(error))`.                                                              |
| `Error0.causes(error)`               | The cause chain as an array.                                                           |
| `Error0.flow(error, key)`            | A field's values down the cause chain.                                                 |
| `Error0.assign(error, props)`        | Set fields on an existing error.                                                       |
| `Error0.mark(string \| symbol)`      | Brand the class for cross-bundle `is()` checks; a string mark also becomes `err.name`. |
| `Error0.MAX_CAUSES_DEPTH`            | Cap on cause-chain walks (default `99`).                                               |

### Instance

| Call                       | Result                                      |
| -------------------------- | ------------------------------------------- |
| `err.serialize(isPublic?)` | Serialize this error (public by default).   |
| `err.serializePublic()`    | What an untrusted client may see.           |
| `err.serializePrivate()`   | The full view — for logs and dev tooling.   |
| `err.round(isPublic?)`     | Round-trip this error.                      |
| `err.assign(props)`        | Set fields, return `this`.                  |
| `err.flow(key)`            | A field's values down the cause chain.      |
| `err.causes()`             | The cause chain as an array.                |
| `err.own`                  | Raw fields set on this error (pre-resolve). |

### Plugin builder

`Error0.plugin()` starts a reusable builder. Each call returns a new builder
with the types added; pass the finished builder to `Error0.use(builder)`.

| Call                  | Result                                                       |
| --------------------- | ------------------------------------------------------------ |
| `Error0.plugin()`     | Start a plugin builder.                                      |
| `.prop(key, options)` | Add a typed field (same options as `Error0.use('prop', …)`). |
| `.method(key, fn)`    | Add an instance method.                                      |
| `.adapt(fn)`          | Add a hook that runs on every new error.                     |
| `.cause(value)`       | Customize how the `cause` serializes and rebuilds.           |
| `.stack(value)`       | Customize how the `stack` serializes.                        |
| `.message(value)`     | Customize how the `message` serializes.                      |
| `.use(kind, …)`       | Same as the methods above, addressed by kind.                |
| `.use(builder)`       | Merge another builder into this one.                         |

```ts
// `.prop(...)` is shorthand for `.use('prop', ...)` — both exist on the builder
const statusPlugin = () =>
  Error0.plugin().prop('status', {
    /* init / resolve / serialize / deserialize */
  })
```

<!-- docs:end -->

## Community

Questions, bugs, or want to hang with other builders? Join the 1gr14 community —
one hub for all our open-source projects, this one included. Get help, share
what you built, or just say hi:
[1gr14.dev/community](https://1gr14.dev/community)

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/). Security reports:
[SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)

---

```text
Building open-source software for the glory of the Lord Jesus Christ ☦️
With love for developers of all backgrounds around the world ❤️
Sergei Dmitriev, 2026 😎
```
