import { Box } from '@mantine/core'
import type { NextPage } from 'next'
import NavbarMain from '../components/navbar.component'


const Home: NextPage = () => {
  return (
    <Box>
      <NavbarMain activeGroup='dashboard' />
    </Box>
  )
}

export default Home
