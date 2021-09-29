import Router from 'next/router'
import { createContext, ReactNode, useEffect, useState } from 'react'
import { parseCookies, setCookie, destroyCookie } from 'nookies'
import { api } from '../services/apiClient'

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

let authChannel: BroadcastChannel // authChannel: BroadcastChannel (para mandar mensagens para outras abas abertas)

export function signOut() {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  authChannel.postMessage('signOut') // on signOut mandar mensagem 'signOut' para todas as abas

  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user //se tiver vazio === false, se não === true -> valor vazio ja é false, negando o valor !user === true -> negando novamente !!user === false

  useEffect(() => {
    authChannel = new BroadcastChannel('auth') // criação do broadcastChannel auth

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case 'signOut': // se receber a mensagem 'signOut', executa o signOut em outras abas
          signOut();
          break;
        default:
          break;
      }
    }
  }, [])


  // verificando caso ja exista cookies do usuario
  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies()

    if (token) {
      api.get('/me')
        .then(response => {
          const { email, permissions, roles } = response.data

          setUser({ email, permissions, roles })
        })
        .catch(() => {
          signOut();
        })
    }
  }, [])


  const signIn = async ({ email, password}: SignInCredentials) => {
    try {
      const response = await api.post('sessions', {
        email,
        password
      })

      const { token, refreshToken, permissions, roles } = response.data

      //sessionStorage -> Saiu do browser/app, acabou o sessionStorage
      //localStorage -> Dura até se reiniciar o pc, porem não funciona muito bem com next pois não é acessivel server side
      //cookies -> Mesma coisa que localStorage, porém disponivel server side -> best for next

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      // Não salvar informações do user (roles, email, nome, etc) pq podem mudar facilmente.
      // É melhor só salvar os token e com os token salvos podemos buscar os dados do user sempre.

      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}` // Salvando o token no header após primeiro login

      Router.push('/dashboard')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user}}>
      {children}
    </AuthContext.Provider>
  )
}
