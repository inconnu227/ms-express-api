import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Dossier où seront stockées les images KYC
export const KYC_UPLOAD_DIR = join(process.cwd(), 'uploads', 'kyc');

export const multerConfig = {
  storage: diskStorage({
    destination: KYC_UPLOAD_DIR,
    filename: (req, file, callback) => {
      // Génère un nom de fichier unique : uuid + extension d'origine
      const uniqueSuffix = uuidv4();
      const ext = extname(file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // N'accepter que les images
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return callback(new Error('Seules les images sont autorisées'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5 MB
  },
};