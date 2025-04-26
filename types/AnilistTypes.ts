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
  id: number
  status?: string
  progress?: string
  createdAt: number
  type: string
  likeCount: number
  siteUrl: string
  media?: Media
  text?: string
  replies?: Reply[]
}

interface Reply {
  id: number
  createdAt: number
  text: string
  user: ReplyUser
  likeCount: number
}

interface ReplyUser {
  id: number
  name: string
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
  id: number
  text: string
  createdAt: number
  createdAtString: string
  status?: string
  type: string
  likes: number
  replies?: LocalReplies[]
  url: string
  progress?: string
  duration?: number
}

interface LocalReplies {
  id: number
  text: string
  createdAt: number
  user: string
  likes: number
  createdAtString: string
}