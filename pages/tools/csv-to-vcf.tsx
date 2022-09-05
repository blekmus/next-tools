import type { NextPage } from 'next'
import Head from 'next/head'
import CsvToVcf from '../../components/csv-to-vcf.component'

const CsvToVcfPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Csv to Vcf</title>
        <meta name="description" content="Convert csv to vcf" />

        <meta property="og:title" content="Csv to Vcf" />
        <meta property="og:description" content="Convert csv to vcf" />
        <meta property="og:url" content="https://tools.thelonelylands.com" />

        <meta property="twitter:title" content="Csv to Vcf" />
        <meta property="twitter:description" content="Convert csv to vcf" />
        <meta property="twitter:url" content="https://tools.thelonelylands.com" />
      </Head>
      
      <CsvToVcf />
    </>
  )
}

export default CsvToVcfPage
