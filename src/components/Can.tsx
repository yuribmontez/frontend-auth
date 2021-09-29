import { ReactNode } from 'react'
import { useCan } from '../hooks/useCan'

interface CanProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
}

export function Can({ children, permissions, roles}: CanProps) {
  const userCanSeeComponent = useCan({ permissions, roles })

  if (!userCanSeeComponent) { // se usuario não tiver permissão para ver o componente, return null
    return null
  }

  // se passar na verificação, mostra o children
  return (
    <>
      {children}
    </>
  )
}
