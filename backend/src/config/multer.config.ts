import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const scanMulterOptions: MulterModuleOptions = {
  storage: diskStorage({
    destination: './uploads/scans',
    filename: (req, file, cb) => {
      const ext = extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
};
