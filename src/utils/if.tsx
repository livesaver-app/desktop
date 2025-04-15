export function If(
  props: React.PropsWithChildren<{ condition: boolean; fallback?: React.ReactNode }>
) {
  return props.condition ? props.children : props.fallback
}
