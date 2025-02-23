import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-gray-600 dark:text-gray-300" />
      <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">Loading...</p>
    </div>
  )
}