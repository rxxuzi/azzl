
import { useState } from "react"
import { type ModelType, models } from "../types/models"
import { ChevronDown } from "lucide-react"
import { getModelIcon } from "./ModelIcons"

interface ModelSelectorProps {
  model: ModelType
  setModel: (model: ModelType) => void
}

export function ModelSelector({ model, setModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ModelIcon = getModelIcon(model)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <ModelIcon className="w-5 h-5" />
        <span className="text-sm font-medium text-white">{model.charAt(0).toUpperCase() + model.slice(1)}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1A1A] rounded-lg shadow-lg overflow-hidden z-50">
            {models.map(({ id, label, description }) => {
              const ItemIcon = getModelIcon(id)
              return (
                <button
                  key={id}
                  onClick={() => {
                    setModel(id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-start gap-3 p-3 hover:bg-white/5 transition-colors ${
                    model === id ? "bg-white/10" : ""
                  }`}
                >
                  <ItemIcon className="w-5 h-5 mt-1" />
                  <div className="text-left">
                    <div className="font-medium text-white/90">{label}</div>
                    <div className="text-xs text-white/40">{description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}