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
          status
          progress
          createdAt
          type
          likeCount
          replyCount
          siteUrl
          media {
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
          replyCount
        }
      }
    }
  }
`

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
)

function reducer(state: {output: string}, action: {type: string, payload?: string}) {
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
  const [currentChart, setCurrentChart] = useState('likesPerMonth')

  const [state, dispatch] = useReducer(reducer, { output: '' })

  const [likesData, setLikesData] = useState<{ id: string; count: number }[]>(
    []
  )
  const [repliesData, setRepliesData] = useState<
    { id: string; count: number }[]
  >([])

  const handleStart = async () => {
    dispatch({ type: 'reset' })
    setDownloadUrl('')
    setLoading(true)
    setError('')
    setLikesData([])
    setRepliesData([])
    setCurrentChart('likesPerMonth')

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
        'THIS MIGHT TAKE A WHILE. 5 second delay is added between each request to prevent rate limiting',
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

        localActivity.url = activity.siteUrl
        localActivity.replies = activity.replyCount
        localActivity.createdAt = activity.createdAt
        localActivity.type = activity.type
        localActivity.likes = activity.likeCount

        if (activity.text) {
          localActivity.text = activity.text
        }

        if (activity.media) {
          if (activity.media.title.english) {
            localActivity.text = activity.media.title.english
          } else {
            history
            localActivity.text = activity.media.title.romaji
          }
        }

        if (activity.progress && activity.status) {
          localActivity.status = `${activity.status} ${activity.progress}`
        } else if (activity.status) {
          localActivity.status = activity.status
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

      // increment page
      // hasNextPage = false
      page++
      await timer(5000)
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
          count: activity.replies,
        })
      } else {
        repliesPerMonth[index2].count += activity.replies
      }
    })

    setLikesData(likesPerMonth.reverse())
    setRepliesData(repliesPerMonth.reverse())

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
    if (type === 'likesPerMonth') {
      return likesData.map((item) => item.id)
    }

    if (type === 'repliesPerMonth') {
      return repliesData.map((item) => item.id)
    }

    if (type === 'totalLikes') {
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

    if (type === 'totalReplies') {
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

    return []
  }

  const dataset = (type: string) => {
    if (type === 'likesPerMonth') {
      return likesData.map((item) => item.count)
    }

    if (type === 'repliesPerMonth') {
      return repliesData.map((item) => item.count)
    }

    if (type === 'totalLikes') {
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

    if (type === 'totalReplies') {
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
                Enter Anilist username
              </Title>

              <Group>
                <Input
                  sx={{ maxWidth: '300px' }}
                  variant="filled"
                  placeholder="blekmus"
                  size="md"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.currentTarget.value)
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
                mb="md"
                value={currentChart}
                onChange={setCurrentChart}
                data={[
                  { label: 'Likes per month', value: 'likesPerMonth' },
                  { label: 'Total likes', value: 'totalLikes' },
                  { label: 'Replies per month', value: 'repliesPerMonth' },
                  { label: 'Total replies', value: 'totalReplies' },
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
