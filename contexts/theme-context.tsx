"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type ColorScheme = "default" | "high-contrast" | "colorblind-friendly" | "dark-mode" | "monochrome"

interface ThemeContextType {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  getVolatilityColor: (volatility: number) => string
  getPerformanceColor: (performance: number) => string
  getVolumeColor: (volume: number) => string
  getSeverityColor: (severity?: string) => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

const COLOR_SCHEMES = {
  default: {
    volatility: {
      veryLow: "bg-green-500",
      low: "bg-green-400",
      medium: "bg-yellow-400",
      high: "bg-orange-400",
      veryHigh: "bg-red-400",
      extreme: "bg-red-500",
    },
    performance: {
      positive: "text-green-500",
      negative: "text-red-500",
      neutral: "text-gray-400",
    },
    volume: {
      low: "bg-blue-200",
      medium: "bg-blue-400",
      high: "bg-blue-600",
    },
    severity: {
      low: "border-green-500 bg-green-50 dark:bg-green-950",
      medium: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
      high: "border-red-500 bg-red-50 dark:bg-red-950",
    },
  },
  "high-contrast": {
    volatility: {
      veryLow: "bg-black",
      low: "bg-gray-800",
      medium: "bg-gray-600",
      high: "bg-gray-400",
      veryHigh: "bg-gray-200",
      extreme: "bg-white border-2 border-black",
    },
    performance: {
      positive: "text-black font-bold",
      negative: "text-white bg-black px-1 rounded",
      neutral: "text-gray-600",
    },
    volume: {
      low: "bg-gray-300",
      medium: "bg-gray-600",
      high: "bg-black",
    },
    severity: {
      low: "border-black border-2 bg-white",
      medium: "border-black border-4 bg-gray-100",
      high: "border-black border-8 bg-black text-white",
    },
  },
  "colorblind-friendly": {
    volatility: {
      veryLow: "bg-blue-600",
      low: "bg-blue-400",
      medium: "bg-orange-400",
      high: "bg-orange-600",
      veryHigh: "bg-purple-500",
      extreme: "bg-purple-700",
    },
    performance: {
      positive: "text-blue-600",
      negative: "text-orange-600",
      neutral: "text-gray-500",
    },
    volume: {
      low: "bg-teal-200",
      medium: "bg-teal-400",
      high: "bg-teal-600",
    },
    severity: {
      low: "border-blue-500 bg-blue-50 dark:bg-blue-950",
      medium: "border-orange-500 bg-orange-50 dark:bg-orange-950",
      high: "border-purple-500 bg-purple-50 dark:bg-purple-950",
    },
  },
  "dark-mode": {
    volatility: {
      veryLow: "bg-emerald-600",
      low: "bg-emerald-500",
      medium: "bg-amber-500",
      high: "bg-orange-500",
      veryHigh: "bg-rose-500",
      extreme: "bg-rose-600",
    },
    performance: {
      positive: "text-emerald-400",
      negative: "text-rose-400",
      neutral: "text-slate-400",
    },
    volume: {
      low: "bg-slate-600",
      medium: "bg-slate-500",
      high: "bg-slate-400",
    },
    severity: {
      low: "border-emerald-600 bg-emerald-950/50",
      medium: "border-amber-600 bg-amber-950/50",
      high: "border-rose-600 bg-rose-950/50",
    },
  },
  monochrome: {
    volatility: {
      veryLow: "bg-gray-200",
      low: "bg-gray-300",
      medium: "bg-gray-400",
      high: "bg-gray-600",
      veryHigh: "bg-gray-700",
      extreme: "bg-gray-900",
    },
    performance: {
      positive: "text-gray-700 font-semibold",
      negative: "text-gray-900 font-bold",
      neutral: "text-gray-500",
    },
    volume: {
      low: "bg-gray-300",
      medium: "bg-gray-500",
      high: "bg-gray-700",
    },
    severity: {
      low: "border-gray-400 bg-gray-50",
      medium: "border-gray-600 bg-gray-100",
      high: "border-gray-800 bg-gray-200",
    },
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("default")

  useEffect(() => {
    const saved = localStorage.getItem("market-explorer-color-scheme")
    if (saved && saved in COLOR_SCHEMES) {
      setColorScheme(saved as ColorScheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("market-explorer-color-scheme", colorScheme)
  }, [colorScheme])

  const getVolatilityColor = (volatility: number): string => {
    const scheme = COLOR_SCHEMES[colorScheme].volatility
    if (volatility > 4) return scheme.extreme
    if (volatility > 3) return scheme.veryHigh
    if (volatility > 2) return scheme.high
    if (volatility > 1.5) return scheme.medium
    if (volatility > 0.5) return scheme.low
    return scheme.veryLow
  }

  const getPerformanceColor = (performance: number): string => {
    const scheme = COLOR_SCHEMES[colorScheme].performance
    if (performance > 0.5) return scheme.positive
    if (performance < -0.5) return scheme.negative
    return scheme.neutral
  }

  const getVolumeColor = (volume: number): string => {
    const scheme = COLOR_SCHEMES[colorScheme].volume
    if (volume > 10000000) return scheme.high
    if (volume > 5000000) return scheme.medium
    return scheme.low
  }

  const getSeverityColor = (severity?: string): string => {
    const scheme = COLOR_SCHEMES[colorScheme].severity
    switch (severity) {
      case "high":
        return scheme.high
      case "medium":
        return scheme.medium
      case "low":
        return scheme.low
      default:
        return ""
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        setColorScheme,
        getVolatilityColor,
        getPerformanceColor,
        getVolumeColor,
        getSeverityColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
