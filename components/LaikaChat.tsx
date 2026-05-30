"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLaikaPageContext } from "@/components/LaikaPageContext"
import { Sparkles, Send, Bot, User, Loader2, X, MessageCircle } from "lucide-react"

const LAIKA_MESSAGES_STORAGE_KEY = "laika-chat-messages"
const LAIKA_OPEN_STORAGE_KEY = "laika-chat-open"
export const LAIKA_TOGGLE_EVENT = "laika:toggle"

function readStoredMessages(): UIMessage[] {
  if (typeof window === "undefined") return []

  try {
    const storedMessages = window.sessionStorage.getItem(LAIKA_MESSAGES_STORAGE_KEY)
    return storedMessages ? JSON.parse(storedMessages) : []
  } catch {
    return []
  }
}

function readStoredOpenState(): boolean {
  if (typeof window === "undefined") return false

  return window.sessionStorage.getItem(LAIKA_OPEN_STORAGE_KEY) === "true"
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
}

function MarkdownBubble({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-2.5 [&_pre]:text-xs [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.85em] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:font-medium [&_a]:text-violet-600 [&_a]:underline dark:[&_a]:text-violet-400 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

export function LaikaChat() {
  const { pageContext } = useLaikaPageContext()
  const pageContextRef = useRef(pageContext)
  const initialMessagesRef = useRef<UIMessage[]>(readStoredMessages())
  const [isOpen, setIsOpen] = useState(readStoredOpenState)
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    id: "laika-dashboard-chat",
    messages: initialMessagesRef.current,
    transport: new DefaultChatTransport({
      api: "/api/laika",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages,
            pageContext: pageContextRef.current,
          },
        }
      },
    }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    window.sessionStorage.setItem(LAIKA_MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    window.sessionStorage.setItem(LAIKA_OPEN_STORAGE_KEY, String(isOpen))
  }, [isOpen])

  useEffect(() => {
    pageContextRef.current = pageContext
  }, [pageContext])

  useEffect(() => {
    const handleToggle = () => setIsOpen((current) => !current)

    window.addEventListener(LAIKA_TOGGLE_EVENT, handleToggle)
    return () => window.removeEventListener(LAIKA_TOGGLE_EVENT, handleToggle)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-gradient-to-br from-violet-500/10 to-violet-600/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <span className="text-sm font-semibold">Laika</span>
                <p className="text-xs text-muted-foreground">CanSat AI Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-secondary/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 mb-3">
                    <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Hi! I&apos;m Laika
                  </h3>
                  <p className="text-muted-foreground text-xs max-w-[280px]">
                    I&apos;m your AI assistant for all things CanSat. Ask me about Arduino, sensors, or data analysis!
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-br from-violet-500/20 to-violet-600/10"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  <div
                    className={`flex-1 px-3 py-2 rounded-xl text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-secondary/50 text-foreground mr-8"
                    }`}
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap">
                        {getMessageText(message)}
                      </div>
                    ) : (
                      <MarkdownBubble>{getMessageText(message)}</MarkdownBubble>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 shrink-0">
                    <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs">Laika is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-border bg-card"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Laika anything..."
                disabled={isLoading}
                className="flex-1 h-9 rounded-xl border-border bg-secondary/50 text-sm focus-visible:ring-violet-500/50"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="rounded-xl bg-primary hover:bg-primary/90 px-3 h-9"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* FAB Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`h-14 w-14 rounded-full shadow-lg transition-all duration-200 ${
          isOpen
            ? "bg-secondary text-foreground hover:bg-secondary/80"
            : "bg-gradient-to-br from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
