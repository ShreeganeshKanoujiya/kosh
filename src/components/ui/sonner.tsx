"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "color-mix(in oklch, var(--success) 10%, var(--popover))",
          "--success-border": "color-mix(in oklch, var(--success) 30%, var(--popover))",
          "--success-text": "var(--success)",
          "--info-bg": "color-mix(in oklch, var(--info) 10%, var(--popover))",
          "--info-border": "color-mix(in oklch, var(--info) 30%, var(--popover))",
          "--info-text": "var(--info)",
          "--warning-bg": "color-mix(in oklch, var(--warning) 18%, var(--popover))",
          "--warning-border": "color-mix(in oklch, var(--warning) 45%, var(--popover))",
          "--warning-text": "var(--toast-warning-text)",
          "--error-bg": "color-mix(in oklch, var(--destructive) 10%, var(--popover))",
          "--error-border": "color-mix(in oklch, var(--destructive) 30%, var(--popover))",
          "--error-text": "var(--destructive)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
