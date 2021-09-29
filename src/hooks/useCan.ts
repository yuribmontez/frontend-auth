import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { validateUserPermissions } from '../utils/validateUserPermissions'

type UseCanParams = {
  permissions?: string[];
  roles?: string[];
}

export function useCan({ permissions, roles}: UseCanParams) {
  const { user, isAuthenticated } = useContext(AuthContext)

  if (!isAuthenticated) { // se não tiver autenticado, não tem permissão
    return false
  }

  //verificar permissões passando dados do user, permissions e roles
  const userHasValidPermissions = validateUserPermissions({
    user,
    permissions,
    roles
  })

  return userHasValidPermissions // resposta da verificação
}
