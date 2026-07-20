import { useMemo, useRef, useState } from "react"
import { ArrowRightCircle, FileUp, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormFieldError } from "@/components/FormFieldError"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 10 * 1024 * 1024

interface FileUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  errorMessage?: string
  disabled?: boolean
}

export function FileUpload({ value, onChange, errorMessage, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInfo = useMemo(() => {
    if (!value) {
      return null
    }

    return {
      size: `${(value.size / 1024 / 1024).toFixed(2)} MB`,
      isPdf: value.type === "application/pdf",
      isOversized: value.size > MAX_FILE_SIZE,
    }
  }, [value])

  const openPicker = () => {
    if (disabled) {
      return
    }

    inputRef.current?.click()
  }

  const handleFile = (file: File | null) => {
    onChange(file)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] ?? null)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) {
      return
    }

    handleFile(event.dataTransfer.files?.[0] ?? null)
  }

  const removeFile = () => {
    if (inputRef.current) {
      inputRef.current.value = ""
    }

    handleFile(null)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        disabled={disabled}
        onChange={handleInputChange}
      />

      <div className="block cursor-pointer" onClick={openPicker} onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) {
          setIsDragging(true)
        }
      }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
        <div
          className={cn(
            "rounded-[32px] border-2 border-dashed p-14 text-center transition-all duration-500",
            isDragging
              ? "scale-105 border-pink-400 bg-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.4)]"
              : "border-white/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:border-purple-400/50 hover:bg-white/10",
            disabled && "cursor-not-allowed opacity-70",
          )}
        >
          {value ? (
            <div className="flex items-center justify-center gap-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-indigo-500 to-pink-500 shadow-2xl">
                <FileUp className="h-12 w-12 text-white" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">{value.name}</p>
                <p className="mt-1 text-lg text-white/70">{fileInfo?.size}</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-white/60">
                  {fileInfo?.isPdf ? "PDF selected" : "Only PDF files are allowed"}
                  {fileInfo?.isOversized ? " · Too large" : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-[18px] border-2 border-white/20 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:bg-white/15"
                onClick={(event) => {
                  event.stopPropagation()
                  removeFile()
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Remove file
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-[24px] border-[3px] border-black bg-[#ffd84d] shadow-[6px_6px_0_0_#000]">
                  <Upload className="h-10 w-10 animate-[bounce_2s_ease-in-out_infinite] text-indigo-300" />
                  <ArrowRightCircle className="absolute -right-2 -bottom-2 h-10 w-10 animate-spin text-pink-400" />
                </div>
              </div>
              <p className="mb-3 mt-6 text-2xl font-bold text-white">
                {isDragging ? "Drop the file here!" : "Click to upload or drag and drop"}
              </p>
              <p className="text-lg text-white/60">
                PDF only, up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <FormFieldError message={errorMessage} />
      )}
    </div>
  )
}