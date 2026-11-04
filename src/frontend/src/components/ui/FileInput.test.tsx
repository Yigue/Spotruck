import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileInput } from './FileInput'

const file = (name: string) => new File(['x'], name, { type: 'application/pdf' })

describe('FileInput', () => {
  it('muestra los textos en español y avisa cuando no hay archivo', () => {
    render(<FileInput accept=".pdf" label="Documento" files={null} onChange={() => {}} />)
    expect(screen.getByText('Elegir archivo')).toBeInTheDocument()
    expect(screen.getByText('Ningún archivo seleccionado')).toBeInTheDocument()
  })

  it('en modo múltiple resume la cantidad de archivos', () => {
    render(<FileInput multiple accept=".pdf" label="Documentos" files={[file('a.pdf'), file('b.pdf')]} onChange={() => {}} />)
    expect(screen.getByText('Elegir archivos')).toBeInTheDocument()
    expect(screen.getByText('2 archivos seleccionados')).toBeInTheDocument()
  })

  it('muestra el nombre del archivo elegido y notifica el cambio', () => {
    const onChange = vi.fn()
    render(<FileInput accept=".pdf" label="Documento" files={[file('cedula.pdf')]} onChange={onChange} />)
    expect(screen.getByText('cedula.pdf')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Documento'), { target: { files: [file('nuevo.pdf')] } })
    expect(onChange).toHaveBeenCalled()
  })
})
