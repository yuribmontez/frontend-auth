import { FormEvent, useContext, useState } from 'react'
import { GetServerSideProps } from 'next'
import { AuthContext } from '../contexts/AuthContext'
import { withSSRGuest } from '../utils/withSSRGuest'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { signIn } = useContext(AuthContext)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const data = {
      email,
      password
    }

    await signIn(data)
  }
  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input type='email' value={email} onChange={e => setEmail(e.target.value)} />
      <input type='password' value={password} onChange={e => setPassword(e.target.value)} />
      <button type='submit'>Entrar</button>
    </form>
  )
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {}
  }
})
