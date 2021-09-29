import { useContext } from 'react'
import { Can } from '../components/Can'
import { AuthContext } from '../contexts/AuthContext'
import { useCan } from '../hooks/useCan'
import { setupAPIClient } from '../services/api'
import { withSSRAuth } from '../utils/withSSRAuth'

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext)

  const userCanSeeMetrics = useCan({
    roles: ['administrator', 'editor']
  })
  return (
    <>
      <h1>Dashboard {user?.email}</h1>

      { userCanSeeMetrics && <div>Métricas</div> }

      <Can permissions={['metrics.list']}>
        <div>Métricas pelo componente</div>
      </Can>

      <button onClick={signOut}>Sign out</button>
    </>
  )
}


export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx) // nova instancia de apiClient para poder passar ctx para a função
  const response = await apiClient.get('/me')

  console.log(response.data)
  return {
    props: {}
  }
})
