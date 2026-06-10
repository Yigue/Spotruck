import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import api from '../../utils/api'
import toast from 'react-hot-toast'

interface RatingFormProps {
  tripId: string
  toUserId: string
  onRated?: () => void
}

interface RatingData {
  overall: number
  punctuality: number
  communication: number
  cargoCondition: number
  comment: string
}

const StarRating = ({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-text-muted w-32">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-xl transition-colors ${
            star <= value ? 'text-warning' : 'text-secondary-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
    <span className="text-xs text-text-muted w-8">{value}/5</span>
  </div>
)

export function RatingForm({ tripId, toUserId, onRated }: RatingFormProps) {
  const [rating, setRating] = useState<RatingData>({
    overall: 0,
    punctuality: 0,
    communication: 0,
    cargoCondition: 0,
    comment: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RatingData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RatingData, string>> = {}

    if (rating.overall === 0) newErrors.overall = 'Requerido'
    if (rating.punctuality === 0) newErrors.punctuality = 'Requerido'
    if (rating.communication === 0) newErrors.communication = 'Requerido'
    if (rating.cargoCondition === 0) newErrors.cargoCondition = 'Requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      await api.post('/ratings', {
        tripId,
        toUserId,
        score: rating.overall,
        punctuality: rating.punctuality,
        communication: rating.communication,
        cargoCondition: rating.cargoCondition,
        comment: rating.comment || undefined,
      })

      toast.success('Calificación enviada')
      onRated?.()
    } catch {
      toast.error('Error al enviar calificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Overall Score */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Puntuación general *</span>
          {errors.overall && <span className="text-xs text-error">{errors.overall}</span>}
        </div>
        <StarRating
          value={rating.overall}
          onChange={(v) => {
            setRating((r) => ({ ...r, overall: v }))
            if (errors.overall) setErrors((e) => ({ ...e, overall: undefined }))
          }}
          label="Valoración"
        />
      </div>

      {/* Punctuality */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Puntualidad *</span>
          {errors.punctuality && (
            <span className="text-xs text-error">{errors.punctuality}</span>
          )}
        </div>
        <StarRating
          value={rating.punctuality}
          onChange={(v) => {
            setRating((r) => ({ ...r, punctuality: v }))
            if (errors.punctuality) setErrors((e) => ({ ...e, punctuality: undefined }))
          }}
          label="Puntualidad"
        />
      </div>

      {/* Communication */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Comunicación *</span>
          {errors.communication && (
            <span className="text-xs text-error">{errors.communication}</span>
          )}
        </div>
        <StarRating
          value={rating.communication}
          onChange={(v) => {
            setRating((r) => ({ ...r, communication: v }))
            if (errors.communication)
              setErrors((e) => ({ ...e, communication: undefined }))
          }}
          label="Comunicación"
        />
      </div>

      {/* Cargo Condition */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Estado de la carga *</span>
          {errors.cargoCondition && (
            <span className="text-xs text-error">{errors.cargoCondition}</span>
          )}
        </div>
        <StarRating
          value={rating.cargoCondition}
          onChange={(v) => {
            setRating((r) => ({ ...r, cargoCondition: v }))
            if (errors.cargoCondition)
              setErrors((e) => ({ ...e, cargoCondition: undefined }))
          }}
          label="Condición"
        />
      </div>

      {/* Comment */}
      <div className="space-y-1">
        <label className="label">Comentario (opcional)</label>
        <textarea
          className="input"
          rows={3}
          value={rating.comment}
          onChange={(e) => setRating((r) => ({ ...r, comment: e.target.value }))}
          placeholder="Contanos tu experiencia con este servicio..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" variant="accent" loading={loading}>
          Enviar calificación
        </Button>
      </div>
    </form>
  )
}