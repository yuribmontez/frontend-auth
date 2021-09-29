import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { destroyCookie, parseCookies } from 'nookies'
import decode from 'jwt-decode'
import { AuthTokenError } from '../services/error/AuthTokenError'
import { validateUserPermissions } from './validateUserPermissions'

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx)
    const token = cookies['nextauth.token']

    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      }
    }

    // se receber opções (verificação de permissão para ver a pagina)
    if (options) {
      const user = decode<{ permissions: string[], roles: string[] }>(token) // decode do jwt do user
      const { permissions, roles } = options

      //verificação das permissões
      const userHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles
      })

      if (!userHasValidPermissions) { // se não tiver permissão para ver a pagina...
        return {
          redirect: { // redirect para uma pagina onde todos usuarios (logados) tem permissão de ver
            destination: '/dashboard', // podemos usar também (notFound: true) para dar um 404
            permanent: false
          }
        }
      }
    }

    try {
      return await fn(ctx)
    } catch (error) {
      if (error instanceof AuthTokenError) { // se rolar algum erro com authToken durante requisições server-side
        destroyCookie(ctx, 'nextauth.token')
        destroyCookie(ctx, 'nextauth.refreshToken')

        return {
          redirect: {
            destination: '/',
            permanent: false
          }
        }
      }
    }
  }
}
