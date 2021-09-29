import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext'
import { AuthTokenError } from './error/AuthTokenError'


let isRefreshing = false // variavel para impedir varias requisições de refresh do token
let failedRequestsQueue = [] // array para fila de requests enquanto revalidamos o token (refreshToken)

// function pode receber ctx para rodar server-side
export function setupAPIClient(ctx = undefined) { //começa undefined para não dar erro client-side
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}` // deixando o header como default para todas requests
    }
  })


  api.interceptors.response.use(response => {
    return response; // se retornar uma response => tudo certo
  }, (error: AxiosError) => {
    // se retornar erro =>
    if (error.response.status === 401) { // se o erro for 401 (unauthorized)
      if (error.response.data?.code === 'token.expired') { // se (401 for de token expirado...)
        // renovar token
        cookies = parseCookies(ctx) // pegando os cookies novamente

        const { 'nextauth.refreshToken': refreshToken } = cookies // refreshToken que sera enviado para revalidar os tokens

        const originalConfig = error.config // todas as informações de requests que deram erro. (para poder usar na fila)

        // verificação para deixar apenas uma requisição de refresh token => Se um request ja estiver renovando os cookies
        // vai cair no else e não vai executar o refresh novamente.
        if (!isRefreshing) {
          isRefreshing = true

          //post para rota de refresh com refreshToken
          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data // novo token renovado

            // redefinindo novos tokens renovados
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            })

            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            })

            // atualizando header enviado nas requisições com o novo token renovado
            api.defaults.headers['Authorization'] = `Bearer ${token}`

            //fila de requisições. Enviando novo token renovado para as requisições da fila (requisições pausadas)
            failedRequestsQueue.forEach(request => request.resolve(token))
            failedRequestsQueue = [] // limpando fila de requisições
          }).catch(error => {
            // fila de requisições. Enviando error (error de refreshToken) para todas as requisições da fila
            failedRequestsQueue.forEach(request => request.reject(error))
            failedRequestsQueue = [] // limpando fila de requisições

            if (process.browser) {
              signOut()
            }
          }).finally(() => {
            isRefreshing = false // limpando estado de refreshing...
          })
        }

        // Se isRefreshing === true cria a fila de requisições (pausa todas as outras requisições do app)
        return new Promise((resolve, reject) => {
          // adicionando todas as requisições pausadas ao array com função para sucesso do refresh (resolve) e falha (reject)
          failedRequestsQueue.push({
            resolve: (token: string) => { // se der sucesso no refresh.. recebe o novo token
              originalConfig.headers['Authorization'] = `Bearer ${token}` // atualiza os headers das requisições pausadas...

              resolve(api(originalConfig)) // e continua as requisições (despausa as requisições pausadas)
            },
            reject: (error: AxiosError) => { // caso der erro no refresh do refreshToken
              reject(error) // recebe o erro que aconteceu no refresh do refreshToken e despausa as requisições enviando esse erro.
            }
          })
        })
      } else {
        // deslogar usuario
        if (process.browser) {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
    //caso não seja erro de unauthorized, continuar repassando erro
    return Promise.reject(error)
  })

  return api // retorno api para ser usado client-side sem ctx (fara uma nova instancia se for server-side)
}
