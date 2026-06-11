import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Diálogo de confirmación al estilo de la app original:
// "¿Estás seguro? ¡No podrás volver atrás!"
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Sí, confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="text-center space-y-4 py-2">
        <div className="mx-auto w-16 h-16 rounded-full border-4 border-warning flex items-center justify-center">
          <span className="text-3xl text-warning font-bold">!</span>
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        {description && <p className="text-sm text-text-muted">{description}</p>}
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="primary" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="danger" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
