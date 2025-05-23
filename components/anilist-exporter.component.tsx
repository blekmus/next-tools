import {
  Box,
  Button,
  Card,
  Code,
  Container,
  createStyles,
  Group,
  Input,
  SegmentedControl,
  Text,
  Title,
} from '@mantine/core'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js'
import type { NextPage } from 'next'
import { Line } from 'react-chartjs-2'
import NavbarMain from './navbar.component'
import { useReducer, useState } from 'react'
import { request, gql, ClientError } from 'graphql-request'
import { AnilistPage, AnilistUser, LocalActivity } from '../types/AnilistTypes'

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms))

const useStyles = createStyles(() => ({
  base: {
    display: 'flex',
    overflow: 'hidden',
    height: '100vh',
  },
}))

const QUERY_USER = gql`
  query ($username: String) {
    User(name: $username) {
      id
    }
  }
`

const QUERY_HISTORY = gql`
  query ($page: Int, $user: Int, $per_page: Int) {
    Page(page: $page, perPage: $per_page) {
      activities(userId: $user, sort: [ID_DESC]) {
        ... on ListActivity {
          id
          status
          progress
          createdAt
          type
          likeCount
          replies {
            id
            createdAt
            likeCount
            text
            user {
              name
            }
          }
          siteUrl
          media {
            duration
            title {
              english
              romaji
            }
          }
        }

        ... on TextActivity {
          type
          text
          siteUrl
          likeCount
          createdAt
          replies {
            id
            createdAt
            likeCount
            text
            user {
              name
            }
          }
        }
      }
    }
  }
`

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

function reducer(
  state: { output: string },
  action: { type: string; payload?: string }
) {
  switch (action.type) {
    case 'update':
      return { output: state.output + action.payload + '\n' }
    case 'reset':
      return { output: '' }
    default:
      throw new Error()
  }
}

const AnilistExporter: NextPage = () => {
  const { classes } = useStyles()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [currentChart, setCurrentChart] = useState('likes')
  const [currentView, setCurrentView] = useState('perMonth')
  const [delay, setDelay] = useState(5000)

  const [state, dispatch] = useReducer(reducer, { output: '' })

  const [likesData, setLikesData] = useState<{ id: string; count: number }[]>(
    []
  )
  const [repliesData, setRepliesData] = useState<
    { id: string; count: number }[]
  >([])

  const [hoursData, setHoursData] = useState<{ id: string; count: number }[]>(
    []
  )

  const [chaptersData, setChaptersData] = useState<
    { id: string; count: number }[]
  >([])

  const [episodesData, setEpisodesData] = useState<
    { id: string; count: number }[]
  >([])

  const handleStart = async () => {
    dispatch({ type: 'reset' })
    setDownloadUrl('')
    setLoading(true)
    setError('')
    setLikesData([])
    setRepliesData([])
    setHoursData([])
    setChaptersData([])
    setCurrentChart('likes')
    setCurrentView('perMonth')

    let user = {} as AnilistUser

    try {
      dispatch({ type: 'update', payload: `fetching user info of ${username}` })

      user = await request('https://graphql.anilist.co', QUERY_USER, {
        username: username,
      })
    } catch (e) {
      if (e instanceof ClientError) {
        dispatch({ type: 'update', payload: JSON.stringify(e.response) })

        if (e.response.status === 404) {
          setError('User not found')
        } else {
          setError('An error occured')
        }
      }

      setLoading(false)
      return
    }

    dispatch({
      type: 'update',
      payload: `resolved user id to ${user.User.id}`,
    })

    dispatch({
      type: 'update',
      payload: 'fetching user text and list activities',
    })

    dispatch({
      type: 'update',
      payload:
        `THIS MIGHT TAKE A WHILE. ${delay} millisecond is added between each request to prevent rate limiting`,
    })

    // loop through all activity history pages
    const activityHistory = [] as LocalActivity[]
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const history: AnilistPage = await request(
        'https://graphql.anilist.co',
        QUERY_HISTORY,
        {
          page: page,
          user: user.User.id,
          per_page: 50,
        }
      )

      // loop through all activities on the page
      history.Page.activities.forEach((activity) => {
        const localActivity = {} as LocalActivity

        if (!activity.type) {
          return
        }

        localActivity.id = activity.id
        localActivity.createdAtString = new Date(
          activity.createdAt * 1000
        ).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        localActivity.createdAt = activity.createdAt
        localActivity.url = activity.siteUrl
        localActivity.type = activity.type
        localActivity.likes = activity.likeCount
        localActivity.progress = activity.progress
        localActivity.status = activity.status

        if (activity.text) {
          localActivity.text = activity.text
        }

        if (activity.media) {
          localActivity.duration = activity.media.duration

          if (activity.media.title.english) {
            localActivity.text = activity.media.title.english
          } else {
            localActivity.text = activity.media.title.romaji
          }
        }

        if (activity.replies) {
          localActivity.replies = activity.replies.map((reply) => {
            return {
              id: reply.id,
              createdAt: reply.createdAt,
              text: reply.text,
              user: reply.user.name,
              likes: reply.likeCount,
              createdAtString: new Date(
                reply.createdAt * 1000
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            }
          })
        }
      
        activityHistory.push(localActivity)
      })

      // check if there are more pages
      if (history.Page.activities.length < 50) {
        hasNextPage = false
      }

      dispatch({
        type: 'update',
        payload: `loaded page ${page} with ${history.Page.activities.length} activities. total cleaned ${activityHistory.length}`,
      })

      page++
      await timer(delay)
    }

    dispatch({
      type: 'update',
      payload: `completed loading activities totalling ${activityHistory.length}`,
    })

    dispatch({
      type: 'update',
      payload: `generating chart datasets`,
    })

    const likesPerMonth = [] as { id: string; count: number }[]
    const repliesPerMonth = [] as { id: string; count: number }[]
    const hoursWatched = [] as { id: string; count: number }[]
    const chaptersRead = [] as { id: string; count: number }[]
    const episodesWatched = [] as { id: string; count: number }[]

    activityHistory.forEach((activity) => {
      const date = new Date(activity.createdAt * 1000)
      const year = date.getFullYear()

      // check if month+year exists in likesPerMonth
      const index = likesPerMonth.findIndex(
        (item) =>
          item.id === `${date.toLocaleString('en', { month: 'short' })} ${year}`
      )

      if (index === -1) {
        likesPerMonth.push({
          id: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
          count: activity.likes,
        })
      } else {
        likesPerMonth[index].count += activity.likes
      }

      // check if month+year exists in repliesPerMonth
      const index2 = repliesPerMonth.findIndex(
        (item) =>
          item.id === `${date.toLocaleString('en', { month: 'short' })} ${year}`
      )

      if (index2 === -1) {
        repliesPerMonth.push({
          id: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
          count: activity.replies?.length || 0,
        })
      } else {
        repliesPerMonth[index2].count += activity.replies?.length || 0
      }

      // set hoursWatched & episodesWatched
      if (activity.duration && activity.progress && activity.type === 'ANIME_LIST') {
        // set hoursWatched
        const index3 = hoursWatched.findIndex(
          (item) =>
            item.id ===
            `${date.toLocaleString('en', { month: 'short' })} ${year}`
        )

        if (index3 === -1) {
          let episodeNumber: number

          if (activity.progress.includes('-')) {
            const startEp = activity.progress.split('-')[0].trim()
            const endEp = activity.progress.split('-')[1].trim()
            episodeNumber = Number(endEp) - Number(startEp) + 1
          } else {
            episodeNumber = 1
          }

          hoursWatched.push({
            id: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
            count: (episodeNumber * activity.duration) / 60,
          })
        } else {
          let episodeNumber: number

          if (activity.progress.includes('-')) {
            const startEp = activity.progress.split('-')[0].trim()
            const endEp = activity.progress.split('-')[1].trim()
            episodeNumber = Number(endEp) - Number(startEp) + 1
          } else {
            episodeNumber = 1
          }

          hoursWatched[index3].count += (episodeNumber * activity.duration) / 60
        }

        // set episodesWatched
        const index4 = episodesWatched.findIndex(
          (item) =>
            item.id ===
            `${date.toLocaleString('en', { month: 'short' })} ${year}`
        )

        if (index4 === -1) {
          let episodeNumber: number

          if (activity.progress.includes('-')) {
            const startEp = activity.progress.split('-')[0].trim()
            const endEp = activity.progress.split('-')[1].trim()
            episodeNumber = Number(endEp) - Number(startEp) + 1
          } else {
            episodeNumber = 1
          }

          console.log({
            id: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
            count: episodeNumber,
          })

          episodesWatched.push({
            id: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
            count: episodeNumber,
          })
        } else {
          let episodeNumber: number

          if (activity.progress.includes('-')) {
            const startEp = activity.progress.split('-')[0].trim()
            const endEp = activity.progress.split('-')[1].trim()
            episodeNumber = Number(endEp) - Number(startEp) + 1
          } else {
            episodeNumber = 1
          }

          episodesWatched[index4].count += episodeNumber
        }
      }

      // set chaptersRead
      if (activity.progress && activity.type === 'MANGA_LIST') {
        const index4 = chaptersRead.findIndex(
          (item) =>
            item.id ===
            `${date.toLocaleString('en', { month: 'short' })} ${year}`
        )

        if (index4 === -1) {
          let chapterNumber: number

          if (activity.progress.includes('-')) {
            const startEp = activity.progress.split('-')[0].trim()
            const endEp = activity.progress.split('-')[1].trim()
            chapterNumber = Number(endEp) - Number(startEp) + 1
          } else {
            chapterNumber = 1
          }

          chaptersRead.push({
            id: `${date.toLocaleString('en', { month: 'short' })} ${year}`,
            count: chapterNumber,
          })
        } else {
          let chapterNumber: number

          if (activity.progress.includes('-')) {
            const startEp = activity.progress.split('-')[0].trim()
            const endEp = activity.progress.split('-')[1].trim()
            chapterNumber = Number(endEp) - Number(startEp) + 1
          } else {
            chapterNumber = 1
          }

          chaptersRead[index4].count += chapterNumber
        }
      }
    })

    setLikesData(likesPerMonth.reverse())
    setRepliesData(repliesPerMonth.reverse())
    setHoursData(hoursWatched.reverse())
    setChaptersData(chaptersRead.reverse())
    setEpisodesData(episodesWatched.reverse())

    dispatch({
      type: 'update',
      payload: `chart datasets generated`,
    })

    dispatch({
      type: 'update',
      payload: `generating downloadable JSON file`,
    })

    // downloadable json file
    const blob = new Blob([JSON.stringify(activityHistory)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    setDownloadUrl(url)

    dispatch({
      type: 'update',
      payload: `downloadable JSON file generated`,
    })

    dispatch({
      type: 'update',
      payload: `processing completed`,
    })

    setLoading(false)
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  const labels = (type: string) => {
    if (currentView === 'perMonth') {
      if (type === 'likes') {
        return likesData.map((item) => item.id)
      }

      if (type === 'replies') {
        return repliesData.map((item) => item.id)
      }

      if (type === 'hoursWatched') {
        return hoursData.map((item) => item.id)
      }

      if (type === 'chaptersRead') {
        return chaptersData.map((item) => item.id)
      }

      if (type === 'episodesWatched') {
        return episodesData.map((item) => item.id)
      }
    }

    if (currentView === 'total') {
      if (type === 'likes') {
        const totalLikes = [] as { id: string; count: number }[]
        likesData.forEach((item) => {
          if (totalLikes.length === 0) {
            totalLikes.push(item)
          } else {
            totalLikes.push({
              id: item.id,
              count: item.count + totalLikes[totalLikes.length - 1].count,
            })
          }
        })

        return totalLikes.map((item) => item.id)
      }

      if (type === 'replies') {
        const totalReplies = [] as { id: string; count: number }[]
        repliesData.forEach((item) => {
          if (totalReplies.length === 0) {
            totalReplies.push(item)
          } else {
            totalReplies.push({
              id: item.id,
              count: item.count + totalReplies[totalReplies.length - 1].count,
            })
          }
        })

        return totalReplies.map((item) => item.id)
      }

      if (type === 'hoursWatched') {
        const totalHours = [] as { id: string; count: number }[]
        hoursData.forEach((item) => {
          if (totalHours.length === 0) {
            totalHours.push(item)
          } else {
            totalHours.push({
              id: item.id,
              count: item.count + totalHours[totalHours.length - 1].count,
            })
          }
        })

        return totalHours.map((item) => item.id)
      }

      if (type === 'chaptersRead') {
        const totalChapters = [] as { id: string; count: number }[]
        chaptersData.forEach((item) => {
          if (totalChapters.length === 0) {
            totalChapters.push(item)
          } else {
            totalChapters.push({
              id: item.id,
              count: item.count + totalChapters[totalChapters.length - 1].count,
            })
          }
        })

        return totalChapters.map((item) => item.id)
      }

      if (type === 'episodesWatched') {
        const totalEpisodes = [] as { id: string; count: number }[]
        episodesData.forEach((item) => {
          if (totalEpisodes.length === 0) {
            totalEpisodes.push(item)
          } else {
            totalEpisodes.push({
              id: item.id,
              count: item.count + totalEpisodes[totalEpisodes.length - 1].count,
            })
          }
        })

        return totalEpisodes.map((item) => item.id)
      }
    }

    return []
  }

  const dataset = (type: string) => {
    if (currentView === 'perMonth') {
      if (type === 'likes') {
        return likesData.map((item) => item.count)
      }

      if (type === 'replies') {
        return repliesData.map((item) => item.count)
      }

      if (type === 'chaptersRead') {
        return chaptersData.map((item) => item.count)
      }

      if (type === 'hoursWatched') {
        return hoursData.map((item) => item.count)
      }

      if (type === 'episodesWatched') {
        return episodesData.map((item) => item.count)
      }
    }

    if (currentView === 'total') {
      if (type === 'likes') {
        const totalLikes = [] as { id: string; count: number }[]
        likesData.forEach((item) => {
          if (totalLikes.length === 0) {
            totalLikes.push(item)
          } else {
            totalLikes.push({
              id: item.id,
              count: item.count + totalLikes[totalLikes.length - 1].count,
            })
          }
        })

        return totalLikes.map((item) => item.count)
      }

      if (type === 'replies') {
        const totalReplies = [] as { id: string; count: number }[]
        repliesData.forEach((item) => {
          if (totalReplies.length === 0) {
            totalReplies.push(item)
          } else {
            totalReplies.push({
              id: item.id,
              count: item.count + totalReplies[totalReplies.length - 1].count,
            })
          }
        })

        return totalReplies.map((item) => item.count)
      }

      if (type === 'hoursWatched') {
        const totalHours = [] as { id: string; count: number }[]
        hoursData.forEach((item) => {
          if (totalHours.length === 0) {
            totalHours.push(item)
          } else {
            totalHours.push({
              id: item.id,
              count: item.count + totalHours[totalHours.length - 1].count,
            })
          }
        })

        return totalHours.map((item) => item.count)
      }

      if (type === 'chaptersRead') {
        const totalChapters = [] as { id: string; count: number }[]
        chaptersData.forEach((item) => {
          if (totalChapters.length === 0) {
            totalChapters.push(item)
          } else {
            totalChapters.push({
              id: item.id,
              count: item.count + totalChapters[totalChapters.length - 1].count,
            })
          }
        })

        return totalChapters.map((item) => item.count)
      }

      if (type === 'episodesWatched') {
        const totalEpisodes = [] as { id: string; count: number }[]
        episodesData.forEach((item) => {
          if (totalEpisodes.length === 0) {
            totalEpisodes.push(item)
          } else {
            totalEpisodes.push({
              id: item.id,
              count: item.count + totalEpisodes[totalEpisodes.length - 1].count,
            })
          }
        })

        return totalEpisodes.map((item) => item.count)
      }
    }

    return []
  }

  const data = {
    labels: labels(currentChart),
    datasets: [
      {
        data: dataset(currentChart),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
      },
    ],
  }

  return (
    <Box className={classes.base}>
      <NavbarMain activeGroup="tools" activeSubGroup="anilist-exporter" />

      <Box sx={{ overflow: 'auto', width: '100%' }}>
        <Container size="lg" pt="lg">
          <Title order={2}>Anilist Visualizer & Exporter</Title>

          <Box mt={30} mb="md">
            <Card mb="lg">
              <Title order={4} mb="md">
                Enter Anilist username & Request delay
              </Title>

              <Group>
                <Input
                  sx={{ maxWidth: '300px' }}
                  variant="filled"
                  placeholder="blekmus"
                  size="md"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.currentTarget.value.length > 0) {
                      setUsername(e.currentTarget.value)
                    }
                  }}
                />
                <Input
                  sx={{ maxWidth: '250px' }}
                  variant="filled"
                  placeholder="5000ms is the default"
                  size="md"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDelay(Number(e.currentTarget.value))
                  }
                />


                <Button color="gray" onClick={handleStart} loading={loading}>
                  Start the magic
                </Button>
              </Group>

              {error !== '' && (
                <Text size="sm" mt="sm" color="red" weight={600}>
                  {error}
                </Text>
              )}
            </Card>

            <Card mb="lg">
              <Title order={4} mb="md">
                Processing Log
              </Title>

              <Code block>{state.output}</Code>
            </Card>

            <Card mb="lg">
              <Title order={4}>Visualizer</Title>
              <Text size="sm" color="dimmed" mb="md">
                Play with your data
              </Text>

              <SegmentedControl
                mb="xs"
                value={currentChart}
                onChange={setCurrentChart}
                data={[
                  { label: 'Likes', value: 'likes' },
                  { label: 'Replies', value: 'replies' },
                  { label: 'Hours Watched', value: 'hoursWatched' },
                  { label: 'Chapters Read', value: 'chaptersRead' },
                  { label: 'Episodes Watched', value: 'episodesWatched' },
                ]}
              />

              <br />

              <SegmentedControl
                mb="md"
                value={currentView}
                onChange={setCurrentView}
                data={[
                  { label: 'Per Month', value: 'perMonth' },
                  { label: 'Total', value: 'total' },
                ]}
              />

              <Line options={options} data={data} />
            </Card>

            <Card mb="lg">
              <Title order={4}>Export History</Title>
              <Text size="sm" color="dimmed">
                Download exported Anilist history as a JSON file
              </Text>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={`${username}-anilist-history.json`}
                >
                  <Button mt="md">Download</Button>
                </a>
              )}
            </Card>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default AnilistExporter
