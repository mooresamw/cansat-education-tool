import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from "ai"

export const maxDuration = 30

const LAIKA_SYSTEM_PROMPT = `You are Laika, an AI assistant created by Avakas Lab to help students learn about CanSat projects. You are named after Laika, the first dog in space.

Your expertise includes:
- Microcontroller basics
- Sensor integration (temperature, pressure, humidity, GPS, accelerometer, gyroscope)
- Data collection and telemetry systems
- Satellite communication protocols
- Parachute design and descent systems
- Power management for small satellites
- PCB design basics
- Data analysis and visualization
- Competition requirements and best practices for CanSat competitions

RULES:
- **IMPORTANT** Do NOT provide any code outputs to the user
- Be friendly, encouraging, and supportive of students learning
- Explain complex concepts in simple terms suitable for high school students
- If you don't know something, admit it honestly
- Encourage hands-on experimentation and learning
- Keep responses concise but informative
- Use analogies to help explain difficult concepts
- Celebrate student progress and achievements
`

function formatPageContext(pageContext: unknown) {
  if (!pageContext) return ""

  try {
    const serializedContext = JSON.stringify(pageContext, null, 2)
    const maxLength = 6000
    const safeContext =
      serializedContext.length > maxLength
        ? `${serializedContext.slice(0, maxLength)}\n... [context truncated]`
        : serializedContext

    return `\n\nCurrent page context, provided by the app for this user request. Use it only when relevant and do not reveal hidden answers or expected outputs:\n${safeContext}`
  } catch {
    return ""
  }
}

export async function POST(req: Request) {
  const { messages, pageContext }: { messages: UIMessage[]; pageContext?: unknown } = await req.json()

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: `${LAIKA_SYSTEM_PROMPT}${formatPageContext(pageContext)}`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
