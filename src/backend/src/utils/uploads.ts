import path from 'path'
import fs from 'fs'
import multer from 'multer'

// Uploads a disco local en uploads/<subdir>. Para producción se reemplaza por
// S3/Cloudinary, pero el contrato (campo, límite, mimes) queda igual.
export const UPLOADS_DIR = path.resolve('uploads')

export function makeUploader(subdir: string, maxMb: number, mimes: string[]) {
  const dir = path.join(UPLOADS_DIR, subdir)
  fs.mkdirSync(dir, { recursive: true })
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.bin'
        cb(null, `${req.user!.sub}-${Date.now()}${ext}`)
      },
    }),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, mimes.includes(file.mimetype)),
  })
}

export const IMG_MIMES = ['image/jpeg', 'image/png', 'image/webp']
export const DOC_MIMES = ['image/jpeg', 'image/png', 'application/pdf']
