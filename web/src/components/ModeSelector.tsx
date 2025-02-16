import { useState } from "react"
import { Lightbulb, Code, FileText, Zap, Menu } from "lucide-react"
import type { Mode } from "../App"

const modes = [
  { id: "ask" as Mode, icon: Lightbulb, color: "#FF3DFF", label: "Ask" },
  { id: "code" as Mode, icon: Code, color: "#FF8A00", label: "Code" },
  { id: "docs" as Mode, icon: FileText, color: "#00FF94", label: "Docs" },
  { id: "deep" as Mode, icon: Zap, color: "#00D1FF", label: "Deep" },
]

interface ModeSelectorProps {
  mode: Mode
  setMode: (mode: Mode) => void
}

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:flex bg-white/5 rounded-lg p-1">
        {modes.map(({ id, icon: Icon, color, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
              mode === id ? "bg-white/10" : "hover:bg-white/5"
            }`}
            style={{
              color: mode === id ? color : "rgba(255, 255, 255, 0.6)",
            }}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile view */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 top-12 bg-[#1A1A1A] rounded-lg shadow-lg overflow-hidden w-48 z-50">
              {modes.map(({ id, icon: Icon, color, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id)
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    mode === id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  style={{ color: mode === id ? color : "rgba(255, 255, 255, 0.6)" }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}