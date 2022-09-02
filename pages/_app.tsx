import { MantineProvider } from '@mantine/core'
import type { MantineThemeOverride } from '@mantine/core'
import { AppProps } from 'next/app'
import '../styles/filepond.css'

function MyApp({ Component, pageProps: { ...pageProps } }: AppProps) {

  const theme = {
    colorScheme: 'dark',
    focusRing: 'never',
  } as MantineThemeOverride

  return (
    <>
      <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
        <Component {...pageProps} />
      </MantineProvider>
    </>
  )
}

export default MyApp
