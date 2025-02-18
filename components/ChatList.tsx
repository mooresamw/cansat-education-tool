"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const initialChats = [
  {
    id: 1,
    from: "John Doe",
    to: "Jane Smith",
    lastMessage: "Hey, can you help me with the Arduino code?",
    timestamp: "2023-05-01 14:30",
  },
  {
    id: 2,
    from: "Bob Johnson",
    to: "Alice Williams",
    lastMessage: "Sure, I'll review your project tomorrow.",
    timestamp: "2023-05-01 15:45",
  },
  {
    id: 3,
    from: "Emma Brown",
    to: "Chris Davis",
    lastMessage: "Don't forget about the team meeting at 3 PM.",
    timestamp: "2023-05-01 16:20",
  },
]

export function ChatList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [chats, setChats] = useState(initialChats)

  const filteredChats = chats.filter((chat) => chat.from.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search by sender name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Last Message</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChats.map((chat) => (
            <TableRow key={chat.id}>
              <TableCell>{chat.from}</TableCell>
              <TableCell>{chat.to}</TableCell>
              <TableCell>{chat.lastMessage}</TableCell>
              <TableCell>{chat.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}