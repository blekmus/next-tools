export interface AnilistUser {
  User: User
}

interface User {
  id?: number
}

export interface AnilistPage {
  Page: Page
}

interface Page {
  activities: Activity[]
}

interface Activity {
  status?: string
  progress?: string
  createdAt: number
  type: string
  likeCount: number
  replyCount: number
  siteUrl: string
  media?: Media
  text?: string
}

interface Media {
  title: Title
  duration?: number
}

interface Title {
  english?: string
  romaji: string
}

export interface LocalActivity {
  text: string
  createdAt: number
  status?: string
  type: string
  likes: number
  replies: number
  url: string
  progress?: string
  duration?: number
}
