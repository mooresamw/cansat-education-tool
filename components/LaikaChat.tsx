"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react"

interface LaikaChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LaikaChat({ open, onOpenChange }: LaikaChatProps) {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/laika" }),
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

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-gradient-to-br from-violet-500/10 to-violet-600/5">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <span className="text-lg font-semibold">Laika</span>
              <p className="text-sm font-normal text-muted-foreground">
                Avakas Lab CanSat AI Assistant
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 mb-4">
                  <Bot className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Hi! I&apos;m Laika
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  I&apos;m your AI assistant for all things CanSat. Ask me about Arduino programming, sensor integration, data analysis, or any other CanSat-related questions!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-br from-violet-500/20 to-violet-600/10"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  )}
                </div>
                <div
                  className={`flex-1 px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-secondary/50 text-foreground mr-12"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return <span key={index}>{part.text}</span>
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 shrink-0">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary/50 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Laika is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-4 border-t border-border bg-card"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Laika anything about CanSat..."
              disabled={isLoading}
              className="flex-1 rounded-xl border-border bg-secondary/50 focus-visible:ring-violet-500/50"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-xl bg-primary hover:bg-primary/90 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
