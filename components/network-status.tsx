"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NetworkStatusProps {
  isLoading: boolean
  hasError: boolean
  lastUpdate?: Date
}

export function NetworkStatus({ isLoading, hasError, lastUpdate }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const getStatusColor = () => {
    if (!isOnline || hasError) return "destructive"
    if (isLoading) return "secondary"
    return "default"
  }

  const getStatusText = () => {
    if (!isOnline) return "Offline"
    if (hasError) return "Connection Error"
    if (isLoading) return "Updating..."
    return "Connected"
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />
    if (hasError) return <AlertCircle className="h-3 w-3" />
    return <Wifi className="h-3 w-3" />
  }

  return (
    <div className="flex flex-col items-end space-y-1">
      <Badge variant={getStatusColor()} className="text-xs flex items-center space-x-1">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      {lastUpdate && !isLoading && (
        <div className="text-xs text-muted-foreground">Updated: {lastUpdate.toLocaleTimeString()}</div>
      )}
    </div>
  )
}
