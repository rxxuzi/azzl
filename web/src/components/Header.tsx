"use client"

import { useState, useEffect, useRef } from "react"
import { Menu } from "lucide-react"
import { ModeSelector } from "./ModeSelector"
import type { Mode } from "../App"
import type { ModelType } from "../types/models"
import { ModelSelector } from "./ModelSelector"
import { APP_NAME } from '../App';
interface HeaderProps {
  mode: Mode
  setMode: (mode: Mode) => void
  model: ModelType
  setModel: (model: ModelType) => void
  onMenuClick: () => void
}

export function Header({ mode, setMode, model, setModel, onMenuClick }: HeaderProps) {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const modelSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#111111]/80 backdrop-blur-xl border-b border-white/10 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/azzl.svg" alt="AZZL ICON" className="h-6" />
            <span className="text-lg font-bold bg-gradient-to-r from-[#00D1FF] to-[#FF3DFF] bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </div>
          <div ref={modelSelectorRef}>
            <ModelSelector
              model={model}
              setModel={setModel}
              isOpen={isModelSelectorOpen}
              setIsOpen={setIsModelSelectorOpen}
            />
          </div>
        </div>
        <ModeSelector mode={mode} setMode={setMode} />
      </div>
    </header>
  )
}

