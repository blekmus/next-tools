import { createGetInitialProps } from '@mantine/next'
import Document, { Head, Html, Main, NextScript } from 'next/document'

const getInitialProps = createGetInitialProps()

class NextDocument extends Document {
  static getInitialProps = getInitialProps

  render() {
    return (
      <Html style={{ backgroundColor: '#1a1b1e' }}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default NextDocument
