import { Box, Container, createStyles, Title } from '@mantine/core'
import type { NextPage } from 'next'
import NavbarMain from '../components/navbar.component'

const useStyles = createStyles(() => ({
  base: {
    display: 'flex',
    overflow: 'hidden',
    height: '100vh',
  },
}))


const Home: NextPage = () => {
  const { classes } = useStyles()

  return (
    <Box className={classes.base}>
      <NavbarMain activeGroup="dashboard" />

      <Box sx={{ overflow: 'auto', width: '100%' }}>
        <Container size="lg" pt="lg">
          <Title order={2}>Hey! </Title>

          {/* <Box mt={30} mb="md">
          </Box> */}
        </Container>
      </Box>
    </Box>
  )
}

export default Home
