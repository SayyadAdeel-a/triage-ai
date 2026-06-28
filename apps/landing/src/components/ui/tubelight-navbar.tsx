"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useMotionValue } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([])
  
  const highlightLeft = useMotionValue(0)
  const highlightWidth = useMotionValue(0)
  const highlightOpacity = useMotionValue(0)

  const { scrollY } = useScroll()

  useEffect(() => {
    let sectionsData: any[] = []

    const updateSections = () => {
      sectionsData = items.map((item, index) => {
        if (item.url.startsWith("#")) {
          const sectionId = item.url.substring(1)
          const section = document.getElementById(sectionId)
          if (section) {
            return {
              name: item.name,
              top: section.offsetTop,
              height: section.offsetHeight,
              index
            }
          }
        }
        return null
      }).filter(Boolean)
    }

    const handleScroll = (y: number) => {
      if (sectionsData.length === 0) updateSections()
      if (sectionsData.length === 0) return

      // Calculate perfect active scroll positions for each section
      const activeScrollPositions = sectionsData.map((section, index) => {
        if (index === 0) return 0 // The first section is perfectly active at the very top
        return section.top - window.innerHeight / 3
      })

      let currentAnalogIndex = 0

      if (y <= activeScrollPositions[0]) {
        currentAnalogIndex = 0
      } else if (y >= activeScrollPositions[activeScrollPositions.length - 1]) {
        currentAnalogIndex = activeScrollPositions.length - 1
      } else {
        for (let i = 0; i < activeScrollPositions.length - 1; i++) {
          const currY = activeScrollPositions[i]
          const nextY = activeScrollPositions[i + 1]
          if (y >= currY && y < nextY) {
            const progress = (y - currY) / (nextY - currY)
            currentAnalogIndex = i + progress
            break
          }
        }
      }

      const activeIdx = Math.round(currentAnalogIndex)
      const currentSection = sectionsData[activeIdx]
      if (currentSection) {
        setActiveTab(prev => prev !== currentSection.name ? currentSection.name : prev)
      }

      const i1 = Math.floor(currentAnalogIndex)
      const i2 = Math.ceil(currentAnalogIndex)
      const p = currentAnalogIndex - i1

      const el1 = navItemsRef.current[i1]
      const el2 = navItemsRef.current[i2]

      if (el1 && el2) {
        const left = el1.offsetLeft + p * (el2.offsetLeft - el1.offsetLeft)
        const width = el1.offsetWidth + p * (el2.offsetWidth - el1.offsetWidth)
        highlightLeft.set(left)
        highlightWidth.set(width)
        highlightOpacity.set(1)
      } else if (el1) {
        highlightLeft.set(el1.offsetLeft)
        highlightWidth.set(el1.offsetWidth)
        highlightOpacity.set(1)
      }
    }

    const unsubscribe = scrollY.on("change", handleScroll)
    
    setTimeout(() => {
      updateSections()
      handleScroll(window.scrollY)
    }, 100)
    
    window.addEventListener('resize', updateSections)
    
    return () => {
      unsubscribe()
      window.removeEventListener('resize', updateSections)
    }
  }, [items, scrollY, highlightLeft, highlightWidth, highlightOpacity])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="relative flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        <motion.div
          className="absolute h-[calc(100%-8px)] top-1 bg-primary/5 rounded-full -z-10"
          style={{
            left: highlightLeft,
            width: highlightWidth,
            opacity: highlightOpacity,
          }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
            <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
            <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
            <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
          </div>
        </motion.div>

        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <a
              key={item.name}
              ref={el => { navItemsRef.current[index] = el }}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
