import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { AppError } from '../utils/errors.js'

// Wave 1 (AD-1): almacenamiento en disco local bajo uploads/, servido por
// express.static('/uploads'). S3/Cloudinary quedan explícitamente diferidos.
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads')

// Extensión derivada del mimetype: un avatar por usuario → <userId>.<ext>
const AVATAR_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const DOCUMENT_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png']

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, 'avatars')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = AVATAR_EXTENSIONS[file.mimetype]
    const userId = req.user!.sub
    // AD-6: si la extensión coincide se pisa el archivo anterior; si difiere,
    // el viejo queda como huérfano acotado (1 por usuario) y la URL apunta al nuevo
    cb(null, `${userId}.${ext}`)
  },
})

const documentsStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, 'documents', req.user!.sub)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    // Solo alfanuméricos, punto, guion y guion bajo en el nombre original
    cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
  },
})

// Documentación de un camión (cédula, seguro, Senasa): uploads/documents/trucks/<truckId>/
const truckDocumentsStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, 'documents', 'trucks', String(req.params.id))
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
  },
})

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in AVATAR_EXTENSIONS) cb(null, true)
    else cb(new AppError(400, 'UNSUPPORTED_MEDIA_TYPE', 'Subí una imagen JPG, PNG o WebP'))
  },
})

export const documentsUpload = multer({
  storage: documentsStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB por archivo
  fileFilter: (_req, file, cb) => {
    if (DOCUMENT_MIMETYPES.includes(file.mimetype)) cb(null, true)
    else cb(new AppError(400, 'UNSUPPORTED_MEDIA_TYPE', 'Subí un PDF, JPG o PNG'))
  },
})

export const truckDocumentsUpload = multer({
  storage: truckDocumentsStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB por archivo
  fileFilter: (_req, file, cb) => {
    if (DOCUMENT_MIMETYPES.includes(file.mimetype)) cb(null, true)
    else cb(new AppError(400, 'UNSUPPORTED_MEDIA_TYPE', 'Subí un PDF, JPG o PNG'))
  },
})
