/** Join class names, dropping falsy entries.
 *  Deliberately tiny — the components emit plain `jrk-*` classes, so there is
 *  no Tailwind class-merge problem to solve and no need for clsx/tailwind-merge. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Build the modifier class list for a BEM-ish block.
 *    variantClass('jrk-btn', { variant: 'primary', size: 'sm' })
 *    -> 'jrk-btn jrk-btn--primary jrk-btn--sm' */
export function variantClass(
  block: string,
  mods: Record<string, string | boolean | undefined>,
): string {
  const out = [block];
  for (const value of Object.values(mods)) {
    if (typeof value === 'string' && value) out.push(`${block}--${value}`);
  }
  return out.join(' ');
}
