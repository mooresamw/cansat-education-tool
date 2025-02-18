import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ResponseModalProps {
  isOpen: boolean
  onClose: () => void
  response: string
}

export default function ResponseModal({ isOpen, onClose, response }: ResponseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Code Execution Result</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{response}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
