import { createRequest, http } from '@/shared/http'

/**
 * 会话
 */
export interface Session {
  /**
   * 会话唯一标识符（ID）
   */
  id: string

  /**
   * 会话名称，默认由大语言模型自动生成
   */
  name: string

  /**
   * 用户输入的参数对象，内容结构由具体业务决定
   */
  inputs: Record<string, unknown>

  /**
   * 会话当前状态（例如：active、completed、archived 等）
   */
  status: string

  /**
   * 会话的开场白内容
   */
  introduction: string

  /**
   * 会话创建时间（Unix 时间戳，单位：秒或毫秒，需根据实际 API 确认）
   */
  created_at: number

  /**
   * 会话最后更新时间（Unix 时间戳，单位：秒或毫秒，需根据实际 API 确认）
   */
  updated_at: number
}

/**
 * 获取会话列表
 */
export const fetchConversations = createRequest<
  {
    /**
     * 会话对象数组
     */
    data: Session[]
    /**
     * 是否还有更多数据可供加载
     */
    has_more: boolean
    /**
     * 当前返回的会话条数。
     * 若传入的 limit 超过系统限制，则实际返回系统限制的最大数量。
     */
    limit: number
  },
  {
    /**
     * （选填）当前页最后面一条记录的 ID，默认 null
     */
    last_id?: string
    /**
     * （选填）一次请求返回多少条记录，默认 20 条，最大 100 条，最小 1 条。
     */
    limit?: number
    /**
     * （选填）排序字段，默认 -updated_at(按更新时间倒序排列)
     * 可选值：created_at, -created_at, updated_at, -updated_at
     * 字段前面的符号代表顺序或倒序，-代表倒序
     */
    sort_by?: string
  }
>('/chat/conversations')

/**
 * 重命名会话
 */
export const renameConversation = (id: string, name: string) => http.post<Session>(
  `/chat/conversations/${id}/name`,
  { name },
)

/**
 * 删除会话
 */
export const deleteConversation = (id: string) => http.delete(`/chat/conversations/${id}`)

export interface Message {
  /** 消息 ID */
  id: string
  /** 会话 ID */
  conversation_id: string
  /** 用户输入的参数 */
  inputs: Record<string, any>
  /** 用户的提问内容 */
  query: string
  /** 回复内容 */
  answer: string
  /** 消息创建时间戳 */
  created_at: number
  /** 用户反馈信息 */
  feedback?: any
}

/**
 * 获取会话历史消息
 */
export const fetchMessages = createRequest<
  {
    /**
     * 消息列表
     */
    data: Message[]
    /**
     * 是否还有更多数据可供加载
     */
    has_more: boolean
    /**
     * 当前返回的会话条数。
     * 若传入的 limit 超过系统限制，则实际返回系统限制的最大数量。
     */
    limit: number
  },
  {
    /** 会话 ID */
    conversation_id: string
    /** 当前页第一条聊天记录的 ID，默认 null */
    first_id?: string | null
    /** 每页返回条数，默认 20 */
    limit?: number
  }
>('/chat/messages')

/**
 * 消息反馈
 */
export const feedbackMessage = createRequest<
  { result: 'success' },
  {
    /** 点赞 like, 点踩 dislike, 撤销点赞 null */
    rating: 'like' | 'dislike' | null
    /** 消息反馈的具体信息 */
    content?: string
  },
  { message_id: string }
>(
  `/chat/messages/:message_id/feedbacks`,
  'POST',
)

/**
 * 获取下一轮建议问题列表
 */
export const fetchSuggestions = (id: string) => http.get<
  {
    result: 'success'
    data: string[]
  }
>(`/chat/messages/${id}/suggested`)
