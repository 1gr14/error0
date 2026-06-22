# @1gr14/error0

> One typed `Error` class for your whole app — coerce any thrown value into it,
> let typed fields flow through cause chains, and serialize it safely across the
> wire.

[![CI](https://github.com/1gr14/error0/actions/workflows/ci.yml/badge.svg)](https://github.com/1gr14/error0/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@1gr14/error0.svg)](https://www.npmjs.com/package/@1gr14/error0)
[![coverage](https://codecov.io/gh/1gr14/error0/branch/main/graph/badge.svg)](https://codecov.io/gh/1gr14/error0)
[![gzip](https://deno.bundlejs.com/badge?q=@1gr14/error0)](https://bundlejs.com/?q=@1gr14/error0)
[![license](https://img.shields.io/npm/l/@1gr14/error0.svg)](./LICENSE)

<!-- docs:start -->

A project deserves **one** error class — a single type that any thrown value can
be coerced into, that carries errors from your server to your client, and that
knows how to serialize itself two ways: **privately** for your logs and
**publicly** for untrusted clients. `error0` is that class, built as a small
**builder**: you start from `Error0` and extend it with typed fields — inline,
or with ready-made plugins.

Errors travel. You throw in one layer and catch in another — sometimes it's your
error, sometimes a native `Error`, sometimes an Axios or Zod error, sometimes
just a string. `error0` turns any of them into one typed class you control. Its
fields **flow** up through cause chains, and the whole error **serializes** to
JSON and back — so it survives a trip across a process, a queue, or the network.

```ts
import { Error0 } from '@1gr14/error0'
import { statusPlugin } from '@1gr14/error0/plugins/status'
import { codePlugin } from '@1gr14/error0/plugins/code'

// One error class for the whole app — compose the fields you need.
export const AppError = Error0.mark('AppError')
  .use(statusPlugin({ transport: 'public' })) // status crosses the wire
  .use(codePlugin({ codes: ['UNAUTHORIZED', 'FORBIDDEN'] as const })) // private by default

// Type the instance, the way you would with `class AppError extends Error`.
export type AppError = InstanceType<typeof AppError>

// Build with typed fields.
const inner = new AppError('Token expired', {
  status: 401,
  code: 'UNAUTHORIZED',
})

// Wrap a cause — fields flow up the chain.
const outer = new AppError('Request failed', { cause: inner })
outer.status // 401  ← flowed up from the inner cause
outer.flow('status') // [undefined, 401]  — the value at each level of the chain

// Coerce anything at a boundary, then serialize a client-safe payload.
const json = AppError.serializePublic(outer) // { message, status } — no code, no stack

// ...and rebuild a real AppError on the other side.
const restored = AppError.from(json)
restored.status // 401  ← survived the round-trip
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

This works because of one design rule: **every field is optional on input**. No
field is ever required, so _any_ error can become an `Error0` — there's nothing
that could be "missing".

`Error0` is a real subclass of `Error`, so everything you expect still works:

```ts
const err = new Error0('nope')
err instanceof Error0 // true
err instanceof Error // true
err.message // 'nope'
err.stack // present
```

## One class, fields not subclasses

You usually want a single `AppError` for the whole app — not a `DbError`,
`ApiError`, `ValidationError` zoo. Model the differences as **fields**, not
classes. A field can hold anything — a whole object, not just a primitive — and
you choose whether it crosses the wire.

```ts
// Don't reach for a separate DbError — add a field holding the raw driver error.
const AppError = Error0.use('prop', 'dbError', {
  init: (error: PostgresError) => error, // the input can be a whole object
  resolve: ({ flow }) => flow.find(Boolean),
  serialize: false, // keep it server-side; never send it to a client
  deserialize: false,
})

const err = new AppError('Query failed', { dbError: pgError })
err.dbError // the full driver error, typed — for your logs
AppError.serialize(err) // { message } — `dbError` never crosses the wire
```

But you usually won't set `dbError` by hand — you catch an `unknown` and don't
even know it _is_ a database error. So pair the field with an **`adapt`** hook:
it runs on every new error (including the ones `from()` builds), looks at the
`cause`, and routes a driver error into the field for you.

```ts
const AppError = Error0.use('prop', 'dbError', {
  init: (error: PostgresError) => error,
  resolve: ({ flow }) => flow.find(Boolean),
  serialize: false,
  deserialize: false,
}).use('adapt', (error) => {
  // caught something unknown — if a driver error is underneath, capture it
  if (error.cause instanceof PostgresError) {
    return { dbError: error.cause } // returned fields get assigned to the error
  }
})

// now just wrap whatever you caught — the field fills itself in
const err = AppError.from(pgError) // a PostgresError that bubbled up
err.dbError // the driver error, captured automatically — still server-only
```

That's the payoff of one class: you catch once, at the boundary, without knowing
the origin, and the error sorts itself into the right fields. (More on `adapt`
in
[Adapt foreign errors at construction](#adapt-foreign-errors-at-construction).)

One class to catch, one `is()`, one serialize contract — every concern lives as
a typed field on it. The next sections show how fields work.

## Give your errors typed fields

A bare message isn't enough. You want an HTTP status, a code, whatever your app
needs. Add a field with `.use('prop', name, options)`. A field is up to four
small functions, and each one exists for a reason:

```ts
const AppError = Error0.use('prop', 'status', {
  // init: declares the input type (here: number); can also transform it
  init: (input: number) => input,
  // resolve: builds err.status from `flow` — this error's value + all its causes'
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
  makes `new AppError('...', { status })` expect a number. (Note the field is
  still optional — see [the from() rule](#any-error-becomes-your-error).) You
  can transform here too, e.g. a status _name_ → a number.
- **`resolve`** decides what `err.status` returns. `flow` is the array of values
  down the cause chain — this error's own value plus every cause's, nearest
  first. `flow.find(Boolean)` means "the first one anyone set". More on this
  next.
- **`serialize`** / **`deserialize`** are the two ends of the JSON boundary. No
  field crosses the wire without them — pass `false` to keep a field
  server-only.

## Fields flow through cause chains

Here's why `resolve` takes a `flow`. When you wrap an error, the inner error's
status shouldn't vanish. `flow` is this error's value plus every cause's value,
nearest first — so `flow.find(Boolean)` means "the first status anyone set":

```ts
const inner = new AppError('DB unreachable', { status: 503 })
const outer = new AppError('Could not load user', { cause: inner })

outer.status // 503  ← flowed up from `inner`
outer.flow('status') // [undefined, 503]  — outer set nothing, inner set 503
inner.own // { status: 503 } — the raw fields set on an error, before resolve runs
Error0.causes(outer, true) // [outer, inner] — the Error0 links in the chain
```

You decide the rule. Omit `resolve` (or `resolve: false`) and `err.status` is
just this error's own value, ignoring causes. Return `500` and every error
reports `500`. The flow is yours to shape. (Chain walks are capped at
`Error0.MAX_CAUSES_DEPTH`, default `99`, to guard against cycles.)

## Add behavior with methods

Fields are data. You'll also want behavior — a question you ask an error often.
Add a method:

```ts
const AppError = Error0.use('prop', 'status', {
  init: (input: number) => input,
  resolve: ({ flow }) => flow.find(Boolean),
}).use(
  'method',
  'isStatus',
  (error, expected: number) => error.status === expected,
)

const err = new AppError('Forbidden', { status: 403 })
err.isStatus(403) // true

// Every method is also a static that runs `from()` on its first argument —
// so it works on anything: an AppError, a serialized object, or a native error.
AppError.isStatus(err, 403) // true
```

## Adapt foreign errors at construction

An `adapt` hook runs on every new error — including the ones `from()` builds out
of foreign errors. It gets the live error, so it can read the `cause`,
**return** fields to set them, and **mutate** native parts like `message`
directly. This is where you teach `Error0` to understand the rest of the world.

Turn a `ZodError` into a clean 422 — status from the return value, message from
the error's first issue:

```ts
import { z } from 'zod'

const ApiError = AppError.use('adapt', (error) => {
  if (error.cause instanceof z.ZodError) {
    error.message = error.cause.issues[0]?.message ?? error.message // mutate native parts
    return { status: 422 } // returned fields are assigned to the error
  }
})

const err = ApiError.from(zodError) // a ZodError you caught upstream
err.message // 'Invalid email address'  ← first Zod issue
err.status // 422
```

Two levers: **return** an object to set typed fields, and **mutate** the error
for its native parts (`message`, `stack`). To set fields on an error you already
have, use `err.assign({ status: 500 })` (returns the same error) or the static
`AppError.assign(error, props)`.

## Public and private serialization

This is the payoff, and the reason `error0` exists: serialize to plain JSON,
ship it anywhere, rebuild a real typed error on the other side. But the two
audiences are different. Some fields are for your logs, not your users — so
there are two named outputs:

- **`serializePublic()`** — what an untrusted client may see.
- **`serializePrivate()`** — the full view, for trusted consumers (logs, dev
  tooling).

Both are thin sugar over `serialize(isPublic)`. Each bundled plugin takes a
`transport` option to pick its audience:

```ts
const AppError = Error0.use(statusPlugin({ transport: 'public' })) // visible to clients
  .use(codePlugin()) // transport: 'private' by default

const err = new AppError('Nope', { status: 403, code: 'FORBIDDEN' })

err.serializePublic() // { message, status }          ← no code, no stack
err.serializePrivate() // { message, status, code, stack }

// Send the public payload to the browser; log the private one on the server.
const back = AppError.from(err.serializePrivate()) // a real AppError again
back.code // 'FORBIDDEN'  ← survived the round-trip
```

`transport` is just a default for the field's own `serialize` gate: `'public'`
puts the field in both outputs, `'private'` only in `serializePrivate()`,
`'none'` never serializes it. There's no magic — it's the field's `serialize`
function, which gets a call-time `isPublic` flag and returns the value to keep,
or `undefined` to drop it entirely:

```ts
// the exact gate every bundled plugin uses, given `transport`
serialize: ({ resolved, isPublic }) => {
  if (transport === 'none' || (transport === 'private' && isPublic))
    return undefined
  return resolved // otherwise, put the value in the JSON
}
```

Write your own `serialize` and you decide exactly what crosses the wire — mask a
value, round it, or drop it. (`err.round()` / `Error0.round(error)` is
`from(serialize(error))` in one call — handy in tests to assert a value survives
the trip.)

## Reserved fields: message and stack

`message` and `stack` are built into `Error`, so adding them as props throws. To
change how they serialize, use their own hooks instead —
`.use('message', { serialize })` and `.use('stack', { serialize })`:

```ts
// keep the stack out of every serialized output
const AppError = Error0.use('stack', { serialize: () => undefined })
```

The bundled `stackPlugin`, `messageMergePlugin`, and `stackMergePlugin` are
built on exactly these hooks.

## Bundle fields into reusable plugins

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

A plugin builder mirrors the inline API, one method per kind:

- **`.prop(name, options)`** — a typed field (same options as
  `.use('prop', …)`).
- **`.method(name, fn)`** — an instance method.
- **`.adapt(fn)`** — a hook that runs on every new error.
- **`.cause(value)`** / **`.stack(value)`** / **`.message(value)`** — customize
  how those reserved parts serialize and rebuild.
- **`.use(plugin)`** — merge another plugin in, so plugins can compose plugins.

Each `.use(...)` on `Error0` returns a new class with the previous fields plus
the new ones, all typed. Stack as many as you like:

```ts
const AppError = Error0.use(statusPlugin()).use(codePlugin())
const ApiError = AppError.use(tagsPlugin()) // keeps status + code, adds tags
```

## Tell error classes apart: `is` and `mark`

One `AppError` is usually enough — model the rest as fields (see
[One class, fields not subclasses](#one-class-fields-not-subclasses)). But if
you do split into several classes, `is()` tells them apart and narrows the type
inside the branch:

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
no setup needed. But `instanceof` breaks when the same class ships in two
bundles (a server build and a client build) — the two copies are different
classes. `mark` brands a class with a stable id that `is()` checks instead of
the prototype chain, so recognition survives that boundary:

```ts
const ApiError = Error0.mark('myapp/api').use(statusPlugin())

ApiError.is(err) // matched by brand, even where `instanceof` would fail
```

Use a **string** or a **`Symbol.for('...')`** as the mark — both are stable
across bundles. Never a plain `Symbol('...')`: it's unique per bundle. A string
mark also becomes `err.name`. Give several classes the same mark and `is()`
treats them as one family.

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

## Ready-made plugins

The common fields are already written. Import only what you use, each from its
own path under `@1gr14/error0/plugins/*` (tree-shakeable). Every plugin is a
function you call and pass to `.use()`.

Each field plugin below accepts a `transport` option — `'public'`, `'private'`
(default), or `'none'` — that decides whether its field shows up in
`serializePublic()`, only in `serializePrivate()`, or never.

### Typed-field plugins

#### `statusPlugin` — an HTTP-style `status`

```ts
import { statusPlugin } from '@1gr14/error0/plugins/status'

const AppError = Error0.use(statusPlugin({ transport: 'public' }))
new AppError('Not found', { status: 404 }).status // 404
```

Pass a `statuses` map to accept a status by name, and `strict` to reject any
number that isn't in it:

```ts
const AppError = Error0.use(
  statusPlugin({ statuses: { NOT_FOUND: 404, FORBIDDEN: 403 }, strict: true }),
)
new AppError('x', { status: 'NOT_FOUND' }).status // 404
```

#### `codePlugin` — a machine-readable `code`

Pass `codes` to lock the field to a typed union; only those codes type-check.

```ts
import { codePlugin } from '@1gr14/error0/plugins/code'

const AppError = Error0.use(
  codePlugin({ codes: ['NOT_FOUND', 'BAD_REQUEST'] as const }),
)
new AppError('x', { code: 'NOT_FOUND' }) // 'NOPE' would be a type error
```

#### `codeStatusPlugin` — `code` and `status` together

A `{ CODE: status }` map adds both fields and auto-fills the `status` from the
`code`. Use `true` for a code that has no fixed status.

```ts
import { codeStatusPlugin } from '@1gr14/error0/plugins/code-status'

const AppError = Error0.use(
  codeStatusPlugin({
    codes: { NOT_FOUND: 404, FORBIDDEN: 403, RATE_LIMITED: true },
  }),
)
new AppError('x', { code: 'NOT_FOUND' }).status // 404 — filled from the map
```

#### `tagsPlugin` — a `tags` set + `hasTag()`

Tags merge and dedupe across the whole cause chain.

```ts
import { tagsPlugin } from '@1gr14/error0/plugins/tags'

const AppError = Error0.use(
  tagsPlugin({ tags: ['retryable', 'user-error'] as const }),
)
const err = new AppError('x', { tags: ['user-error'] })

err.hasTag('user-error') // true
err.hasTag(['retryable', 'user-error'], 'some') // true — policy 'every' (default) or 'some'
```

Options: `tags` (whitelist), `strict` (default `true` — drops unknown tags when
deserializing), `transport`.

#### `metaPlugin` — free-form `meta`

JSON-safe metadata, merged across causes (nearer errors win on key conflicts).

```ts
import { metaPlugin } from '@1gr14/error0/plugins/meta'

const AppError = Error0.use(metaPlugin())
new AppError('x', { meta: { userId: 7, attempt: 2 } }).meta // { userId: 7, attempt: 2 }
```

#### `expectedPlugin` — an `expected` flag + `isExpected()`

Mark errors that are part of normal flow (a 404, a validation miss) so you don't
log them as crashes. A single `expected: false` anywhere in the chain wins.

```ts
import { expectedPlugin } from '@1gr14/error0/plugins/expected'

const AppError = Error0.use(expectedPlugin())
new AppError('Not found', { expected: true }).isExpected() // true
```

Options: `transport`, and `override` to force the verdict from the error itself.

#### `headersPlugin` — HTTP `headers`

Headers to attach to a response, merged across the chain. Never serialized.

```ts
import { headersPlugin } from '@1gr14/error0/plugins/headers'

const AppError = Error0.use(headersPlugin())
new AppError('Rate limited', { headers: { 'Retry-After': '30' } }).headers
```

#### `responsePlugin` — a `Response` object

Carry a `fetch` `Response` with the error (to read its body later, say). Never
serialized.

```ts
import { responsePlugin } from '@1gr14/error0/plugins/response'

const AppError = Error0.use(responsePlugin())
new AppError('Upstream failed', { response }).response // the Response
```

#### `redirectPlugin` — a navigation `redirect` (for point0)

Attach a redirect to an error. Built for [point0](https://1gr14.dev/point0); a
`RedirectTask` thrown as a `cause` is adopted automatically.

```ts
import { redirectPlugin } from '@1gr14/error0/plugins/point0-redirect'

const AppError = Error0.use(redirectPlugin())
new AppError('Go to login', { redirect: { to: '/login', status: 302 } })
  .redirect
```

### Serialization & adapt plugins

These don't add a field of their own — they shape how the error serializes or
adapts.

#### `causePlugin` — carry the cause chain across the wire

By default a `.cause` isn't serialized — it can't always survive JSON.
`causePlugin` makes it travel: nested `Error0` causes are rebuilt by `from()`,
and foreign errors (Zod, Axios, …) are kept as `{ name, message, stack }` with
their own chain walked (cycle- and depth-guarded).

```ts
import { causePlugin } from '@1gr14/error0/plugins/cause'

const AppError = Error0.use(causePlugin())
// serializePrivate() now includes `cause`, and from() rebuilds it
```

Option: `transport` (default `'private'` — kept out of `serializePublic()`).

#### `stackPlugin` — the stack policy, as a plugin

The core already hides the stack from public output; this makes that policy
explicit and switchable. `transport: 'public'` sends the stack to clients too,
`'none'` strips it everywhere.

```ts
import { stackPlugin } from '@1gr14/error0/plugins/stack'

const AppError = Error0.use(stackPlugin({ transport: 'none' })) // never serialize the stack
```

#### `messageMergePlugin` — one message from the whole chain

On serialize, joins every error's message down the cause chain into one string.

```ts
import { messageMergePlugin } from '@1gr14/error0/plugins/message-merge'

const AppError = Error0.use(messageMergePlugin())
// serialized message: 'Outer: inner: root cause'  — joined with ': '
```

Options: `delimiter` (default `': '`), `fallback` (default `'Unknown error'`).

#### `stackMergePlugin` — one stack from the whole chain

Like `messageMergePlugin`, but joins the stacks of every cause.

```ts
import { stackMergePlugin } from '@1gr14/error0/plugins/stack-merge'

const AppError = Error0.use(stackMergePlugin())
```

Options: `transport` (default `'private'`), `delimiter` (default `'\n'`).

#### `flatOriginalPlugin` — adopt a native cause's message and stack

When you wrap a plain native `Error`, this hoists its message and stack onto
your `Error0` (and unwraps the cause), so the top error reads like the original
instead of a generic wrapper.

```ts
import { flatOriginalPlugin } from '@1gr14/error0/plugins/flat-original'

const AppError = Error0.use(flatOriginalPlugin())
AppError.from(new Error('socket hang up')).message // 'socket hang up'
```

Option: `prefix`, prepended to the adopted message.

<!-- docs:end -->

## Community

Questions, bugs, or want to hang with other builders? Join the 1gr14 community —
one hub for all our open-source projects, this one included. Get help, share
what you built, or just say hi:
[1gr14.dev/#community](https://1gr14.dev/#community)

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/). Security reports:
[SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)

---

Made by [1gr14](https://1gr14.dev), driven by
[community](https://1gr14.dev/#community)
