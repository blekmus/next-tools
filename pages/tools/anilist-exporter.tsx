import type { NextPage } from 'next'
import Head from 'next/head'
import AnilistExporter from '../../components/anilist-exporter.component'

const AnilistExporterPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Anilist Visualizer & Exporter</title>
        <meta name="description" content="Export anilist user profile history/data. Visualize anilist data in a chart" />

        <meta property="og:title" content="Anilist Visualizer & Exporter" />
        <meta property="og:description" content="Export anilist user profile history/data. Visualize anilist data in a chart" />
        <meta property="og:url" content="https://tools.thelonelylands.com" />

        <meta property="twitter:title" content="Anilist Visualizer & Exporter" />
        <meta property="twitter:description" content="Export anilist user profile history/data. Visualize anilist data in a chart" />
        <meta property="twitter:url" content="https://tools.thelonelylands.com" />
      </Head>
      
      <AnilistExporter />
    </>
  )
}

export default AnilistExporterPage
