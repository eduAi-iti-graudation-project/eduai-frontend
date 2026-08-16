import { useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
 accept?: string
 maxSize?: number
 onFileSelect: (file: File) => void
 isUploading?: boolean
 uploadProgress?: number
 className?: string
}

export function FileDropzone({
 accept = ".pdf",
 maxSize = 10 * 1024 * 1024,
 onFileSelect,
 isUploading = false,
 uploadProgress = 0,
 className,
}: FileDropzoneProps) {
 const inputRef = useRef<HTMLInputElement>(null)
 const [isDragging, setIsDragging] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const handleFile = useCallback(
  (file: File) => {
   setError(null)
   if (!file.type.includes("pdf")) {
    setError("Only PDF files are accepted")
    return
   }
   if (file.size > maxSize) {
    setError(`File must be under ${Math.round(maxSize / 1024 / 1024)}MB`)
    return
   }
   onFileSelect(file)
  },
  [maxSize, onFileSelect],
 )

 const handleDrop = useCallback(
  (e: React.DragEvent) => {
   e.preventDefault()
   setIsDragging(false)
   const file = e.dataTransfer.files[0]
   if (file) handleFile(file)
  },
  [handleFile],
 )

 const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragging(true)
 }

 const handleDragLeave = () => setIsDragging(false)

 return (
  <div
   onDrop={handleDrop}
   onDragOver={handleDragOver}
   onDragLeave={handleDragLeave}
   onClick={() => inputRef.current?.click()}
   className={cn(
    "relative cursor-pointer rounded-lg border-2 border-dashed p-lg text-center transition-all",
    isDragging
     ? "border-primary bg-primary-fixed/10 scale-[1.02]"
     : "border-outline-variant hover:border-primary hover:bg-surface-container-low",
    isUploading && "pointer-events-none",
    className,
   )}
  >
   <input
    ref={inputRef}
    type="file"
    accept={accept}
    className="hidden"
    onChange={(e) => {
     const file = e.target.files?.[0]
     if (file) handleFile(file)
     e.target.value = ""
    }}
   />

   {isUploading ? (
    <div className="space-y-3">
     <div className="w-12 h-12 rounded-lg bg-primary-fixed/20 flex items-center justify-center mx-auto">
      <span className="material-symbols-outlined text-primary animate-spin">sync</span>
     </div>
     <p className="font-label-md text-label-md text-primary">Uploading...</p>
     <div className="w-full max-w-2xl mx-auto h-2 rounded-lg bg-surface-container-high overflow-hidden">
      <div
       className="h-full rounded-lg bg-primary-container transition-all duration-300"
       style={{ width: `${uploadProgress}%` }}
      />
     </div>
     <p className="font-label-sm text-label-sm text-on-surface-variant">{uploadProgress}%</p>
    </div>
   ) : (
    <div className="space-y-2">
     <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mx-auto">
      <span className="material-symbols-outlined text-on-surface-variant">upload_file</span>
     </div>
     <p className="font-label-md text-label-md text-on-surface">
      Drop your PDF here, or <span className="text-primary underline">browse</span>
     </p>
     <p className="font-label-sm text-label-sm text-on-surface-variant">
      Maximum {Math.round(maxSize / 1024 / 1024)}MB
     </p>
    </div>
   )}

   {error && (
    <p className="font-label-sm text-label-sm text-error mt-2">{error}</p>
   )}
  </div>
 )
}
