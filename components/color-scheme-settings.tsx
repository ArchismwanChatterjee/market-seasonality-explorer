"use client"

import { useState } from "react"
import { Palette, Eye, Contrast, Accessibility, Moon, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme, type ColorScheme } from "@/contexts/theme-context"

const COLOR_SCHEME_OPTIONS = [
  {
    value: "default" as ColorScheme,
    label: "Default",
    description: "Standard color scheme with vibrant colors",
    icon: <Palette className="h-4 w-4" />,
    preview: ["bg-green-500", "bg-yellow-400", "bg-red-500"],
  },
  {
    value: "high-contrast" as ColorScheme,
    label: "High Contrast",
    description: "Black and white theme for better visibility",
    icon: <Contrast className="h-4 w-4" />,
    preview: ["bg-black", "bg-gray-600", "bg-white border border-black"],
  },
  {
    value: "colorblind-friendly" as ColorScheme,
    label: "Colorblind Friendly",
    description: "Blue-orange palette safe for color vision deficiency",
    icon: <Accessibility className="h-4 w-4" />,
    preview: ["bg-blue-600", "bg-orange-400", "bg-purple-500"],
  },
  {
    value: "dark-mode" as ColorScheme,
    label: "Dark Mode",
    description: "Dark theme optimized for low-light environments",
    icon: <Moon className="h-4 w-4" />,
    preview: ["bg-emerald-600", "bg-amber-500", "bg-rose-500"],
  },
  {
    value: "monochrome" as ColorScheme,
    label: "Monochrome",
    description: "Grayscale theme for minimal distraction",
    icon: <Minus className="h-4 w-4" />,
    preview: ["bg-gray-300", "bg-gray-600", "bg-gray-900"],
  },
]

export function ColorSchemeSettings() {
  const { colorScheme, setColorScheme, getVolatilityColor, getPerformanceColor, getSeverityColor } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const handleSchemeChange = (newScheme: ColorScheme) => {
    setColorScheme(newScheme)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 sm:space-x-2 bg-transparent text-xs sm:text-sm"
        >
          <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Colors</span>
          <span className="sm:hidden">Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Color Scheme Settings</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose a color scheme that works best for your viewing preferences and accessibility needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Current Selection */}
          <Card className="bg-muted/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {COLOR_SCHEME_OPTIONS.find((option) => option.value === colorScheme)?.icon}
                  <div>
                    <div className="font-medium text-sm sm:text-base">
                      Current: {COLOR_SCHEME_OPTIONS.find((option) => option.value === colorScheme)?.label}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {COLOR_SCHEME_OPTIONS.find((option) => option.value === colorScheme)?.description}
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="text-xs self-start sm:self-center">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme Options */}
          <RadioGroup value={colorScheme} onValueChange={handleSchemeChange}>
            <div className="grid gap-3 sm:gap-4">
              {COLOR_SCHEME_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    colorScheme === option.value ? "ring-1 sm:ring-2 ring-primary" : ""
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <RadioGroupItem value={option.value} id={option.value} className="shrink-0" />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {option.icon}
                            <div>
                              <div className="font-medium text-sm sm:text-base">{option.label}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {option.preview.map((colorClass, index) => (
                              <div key={index} className={`w-4 h-4 sm:w-6 sm:h-6 rounded ${colorClass}`} />
                            ))}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Volatility Preview */}
              <div>
                <div className="text-xs sm:text-sm font-medium mb-2">Volatility Levels</div>
                <div className="flex space-x-1 sm:space-x-2">
                  {[0.5, 1.2, 2.1, 3.5, 4.2].map((vol, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded ${getVolatilityColor(vol)} mb-1`} />
                      <div className="text-xs">{vol}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Preview */}
              <div>
                <div className="text-xs sm:text-sm font-medium mb-2">Performance Indicators</div>
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4">
                  <div className={`${getPerformanceColor(2.5)} font-medium text-xs sm:text-sm`}>+2.5% Positive</div>
                  <div className={`${getPerformanceColor(-1.8)} font-medium text-xs sm:text-sm`}>-1.8% Negative</div>
                  <div className={`${getPerformanceColor(0.1)} font-medium text-xs sm:text-sm`}>0.1% Neutral</div>
                </div>
              </div>

              {/* Severity Preview */}
              <div>
                <div className="text-xs sm:text-sm font-medium mb-2">Pattern Severity</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {["low", "medium", "high"].map((severity) => (
                    <div
                      key={severity}
                      className={`p-2 rounded text-center text-xs sm:text-sm ${getSeverityColor(severity)}`}
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)} Severity
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Information */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Accessibility Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start space-x-2">
                <Accessibility className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Colorblind Friendly:</strong> Uses blue-orange palette safe for most color vision types
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Contrast className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  <strong>High Contrast:</strong> Maximum contrast for users with visual impairments
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Dark Mode:</strong> Reduced eye strain in low-light environments
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Monochrome:</strong> Eliminates color distractions for focus on data patterns
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Color Vision Information */}
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm">
                <strong>💡 Tip:</strong> The colorblind-friendly theme is designed to be accessible for:
                <ul className="mt-2 ml-4 space-y-1 text-xs">
                  <li>• Protanopia (red-blind)</li>
                  <li>• Deuteranopia (green-blind)</li>
                  <li>• Tritanopia (blue-blind)</li>
                  <li>• General color vision deficiency</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
