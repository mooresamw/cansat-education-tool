"use client"

import { createContext, useContext, useMemo, useState } from "react"

export type LaikaPageContextValue = Record<string, unknown> | null

interface LaikaPageContextState {
  pageContext: LaikaPageContextValue
  setPageContext: (context: LaikaPageContextValue) => void
}

const LaikaPageContext = createContext<LaikaPageContextState | null>(null)

export function LaikaPageContextProvider({ children }: { children: React.ReactNode }) {
  const [pageContext, setPageContext] = useState<LaikaPageContextValue>(null)
  const value = useMemo(() => ({ pageContext, setPageContext }), [pageContext])

  return <LaikaPageContext.Provider value={value}>{children}</LaikaPageContext.Provider>
}

export function useLaikaPageContext() {
  const context = useContext(LaikaPageContext)

  if (!context) {
    throw new Error("useLaikaPageContext must be used within LaikaPageContextProvider")
  }

  return context
}
