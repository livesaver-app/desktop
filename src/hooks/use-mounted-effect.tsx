import { useEffect } from 'react'

export function useMountedEffect(effect: () => void | (() => void), deps: any[]) {
  // const hasMounted = useRef(false)

  useEffect(() => {
    // if (!hasMounted.current) {
    //   hasMounted.current = true
    //   return
    // }

    return effect()
  }, deps)
}
