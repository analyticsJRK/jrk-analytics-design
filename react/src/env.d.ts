/** Minimal ambient declaration for the one thing this library reads off the
 *  build environment: the dev-only warning guard in <Button iconOnly>.
 *
 *  Declaring it here rather than pulling in @types/node keeps the package free
 *  of Node typings it does not otherwise need, and `process.env.NODE_ENV` is
 *  substituted at build time by every bundler the org uses (Next.js, webpack,
 *  Vite), so the whole guard is dead-code-eliminated in production. */
declare const process: { env: { NODE_ENV?: string } } | undefined;
