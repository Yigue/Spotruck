import { useState, type MouseEvent } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'

// Las URLs guardadas en BD son /uploads/documents/...; la documentación sensible
// ya no se sirve como estático público sino por la API autenticada.
export const protectedPath = (url: string) => url.replace(/^\/uploads\/documents\//, '/files/documents/')

interface Props {
  url: string
  label?: string
  className?: string
}

// Abre un documento privado: lo descarga con el token y lo muestra en otra pestaña
export function ProtectedFileLink({ url, label, className = '' }: Props) {
  const [loading, setLoading] = useState(false)

  const open = async (e: MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.get(protectedPath(url), { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(data)
      window.open(blobUrl, '_blank', 'noopener')
      // se libera la URL temporal pasado un rato (la pestaña ya cargó el archivo)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    } catch {
      toast.error('No se pudo abrir el documento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <a
      href={protectedPath(url)}
      onClick={open}
      className={`text-primary font-medium hover:underline ${className}`}
    >
      {loading ? 'Abriendo…' : (label ?? decodeURIComponent(url.split('/').pop() ?? 'documento'))}
    </a>
  )
}
