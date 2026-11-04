import { useId, useRef } from 'react'

interface FileInputProps {
  accept: string
  multiple?: boolean
  label: string // texto accesible del control
  buttonText?: string
  files: FileList | File[] | null
  onChange: (files: FileList | null) => void
  className?: string
}

// Selector de archivos con textos en español (el <input type="file"> nativo muestra
// «Choose File / No file chosen» según el idioma del navegador).
export function FileInput({ accept, multiple, label, buttonText, files, onChange, className = '' }: FileInputProps) {
  const id = useId()
  const ref = useRef<HTMLInputElement>(null)
  const list = files ? Array.from(files) : []
  const summary =
    list.length === 0 ? 'Ningún archivo seleccionado' : list.length === 1 ? list[0].name : `${list.length} archivos seleccionados`

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <input
        id={id}
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label={label}
        className="sr-only"
        onChange={(e) => onChange(e.target.files)}
      />
      <label
        htmlFor={id}
        className="shrink-0 cursor-pointer rounded bg-primary text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-700 transition-colors peer-focus-visible:ring-2"
      >
        {buttonText ?? (multiple ? 'Elegir archivos' : 'Elegir archivo')}
      </label>
      <span className="text-sm text-text-muted truncate" title={list.map((f) => f.name).join(', ')}>
        {summary}
      </span>
    </div>
  )
}
