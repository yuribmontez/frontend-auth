type User = {
  permissions: string[];
  roles: string[];
}

type ValidateUserPermissionsParams = {
  user: User;
  permissions?: string[];
  roles?: string[];
}

export function validateUserPermissions({ user, permissions, roles }: ValidateUserPermissionsParams) {
  if (permissions?.length > 0) {
    const hasAllPermissions = permissions.every(permission => { // verificação de todas as permissões necessarias
      return user.permissions.includes(permission)
    })

    if  (!hasAllPermissions) { // se não tiver todas as permissões necessarias, não tem permissão
      return false
    }
  }

  if (roles?.length > 0) {
    const hasRole = roles.some(role => { // verificação das roles necessarias
      return user.roles.includes(role)
    })

    if  (!hasRole) { // se não tiver as roles necessarias, não tem permissão
      return false
    }
  }

  return true // se passou por todas as verificações, tem permissão
}
