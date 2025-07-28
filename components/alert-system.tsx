"use client"

import { useState, useEffect } from "react"
import { Bell, Plus, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import type { MarketData } from "@/types/market"

interface Alert {
  id: string
  type: "volatility" | "performance" | "volume"
  condition: "above" | "below"
  threshold: number
  enabled: boolean
  triggered: boolean
  lastTriggered?: Date
}

interface AlertSystemProps {
  data: MarketData[]
  symbol: string
}

export function AlertSystem({ data, symbol }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    type: "volatility" as Alert["type"],
    condition: "above" as Alert["condition"],
    threshold: 2,
  })

  useEffect(() => {
    if (data.length === 0) return

    const latestData = data[data.length - 1]
    const performance = ((latestData.close - latestData.open) / latestData.open) * 100

    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => {
        if (!alert.enabled) return alert

        let currentValue = 0
        switch (alert.type) {
          case "volatility":
            currentValue = latestData.volatility
            break
          case "performance":
            currentValue = Math.abs(performance)
            break
          case "volume":
            currentValue = latestData.volume / 1000000 // Convert to millions
            break
        }

        const shouldTrigger =
          (alert.condition === "above" && currentValue > alert.threshold) ||
          (alert.condition === "below" && currentValue < alert.threshold)

        if (shouldTrigger && !alert.triggered) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Market Alert - ${symbol}`, {
              body: `${alert.type} is ${alert.condition} ${alert.threshold}${alert.type === "volume" ? "M" : "%"}`,
              icon: "/favicon.ico",
            })
          }

          return {
            ...alert,
            triggered: true,
            lastTriggered: new Date(),
          }
        }

        return alert
      }),
    )
  }, [data, symbol])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const addAlert = () => {
    const alert: Alert = {
      id: Date.now().toString(),
      ...newAlert,
      enabled: true,
      triggered: false,
    }
    setAlerts([...alerts, alert])
    setNewAlert({
      type: "volatility",
      condition: "above",
      threshold: 2,
    })
  }

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id))
  }

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((alert) => (alert.id === id ? { ...alert, enabled: !alert.enabled, triggered: false } : alert)),
    )
  }

  const resetAlert = (id: string) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, triggered: false } : alert)))
  }

  const activeAlerts = alerts.filter((alert) => alert.enabled && alert.triggered)

  return (
    <>
      {/* Alert indicator */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{activeAlerts.length} Alert(s) Triggered</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2 relative bg-transparent">
            <Bell className="h-4 w-4" />
            <span>Alerts</span>
            {activeAlerts.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeAlerts.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Market Alerts</DialogTitle>
            <DialogDescription>Set up alerts for volatility, performance, and volume thresholds</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add new alert */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Create New Alert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="alert-type">Type</Label>
                    <Select
                      value={newAlert.type}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volatility">Volatility (%)</SelectItem>
                        <SelectItem value="performance">Performance (%)</SelectItem>
                        <SelectItem value="volume">Volume (M)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="alert-condition">Condition</Label>
                    <Select
                      value={newAlert.condition}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="alert-threshold">Threshold</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({ ...newAlert, threshold: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={addAlert} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert
                </Button>
              </CardContent>
            </Card>

            {/* Active alerts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Active Alerts ({alerts.length})</h3>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts configured</p>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert.id} className={alert.triggered ? "border-orange-500" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium capitalize">{alert.type}</span>
                            <span className="text-muted-foreground">{alert.condition}</span>
                            <span className="font-medium">
                              {alert.threshold}
                              {alert.type === "volume" ? "M" : "%"}
                            </span>
                            {alert.triggered && <Badge variant="destructive">Triggered</Badge>}
                          </div>
                          {alert.lastTriggered && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last triggered: {alert.lastTriggered.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
                          {alert.triggered && (
                            <Button variant="ghost" size="sm" onClick={() => resetAlert(alert.id)}>
                              Reset
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => removeAlert(alert.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
