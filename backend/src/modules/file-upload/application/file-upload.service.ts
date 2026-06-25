import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFileUploadService, UploadResult } from '../domain/file-upload.interface';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FileUploadService implements IFileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly isCloudinaryConfigured: boolean;
  private readonly localUploadPath = path.join(process.cwd(), 'uploads');
  private readonly backendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:43000';

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isCloudinaryConfigured = true;
      this.logger.log('FileUploadService: Configured with Cloudinary storage.');
    } else {
      this.isCloudinaryConfigured = false;
      this.logger.log('FileUploadService: Cloudinary keys missing. Falling back to local disk storage.');
      // Create local upload folder if it doesn't exist
      if (!fs.existsSync(this.localUploadPath)) {
        fs.mkdirSync(this.localUploadPath, { recursive: true });
      }
    }
  }

  async upload(file: any, folder: string): Promise<UploadResult> {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    if (this.isCloudinaryConfigured) {
      return this.uploadToCloudinary(file, folder);
    } else {
      return this.uploadToLocal(file, folder);
    }
  }

  async delete(publicIdOrUrl: string): Promise<void> {
    let publicId = publicIdOrUrl;
    
    // Parse URL if needed
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
      if (this.isCloudinaryConfigured) {
        // Cloudinary URL format: .../upload/v12345/folder/subfolder/publicId.ext
        const parts = publicIdOrUrl.split('/upload/');
        if (parts.length > 1) {
          const pathParts = parts[1].split('/');
          // Shift out the version string (e.g., v17234234)
          if (pathParts[0].startsWith('v')) {
            pathParts.shift();
          }
          const fullPath = pathParts.join('/');
          // Remove file extension
          const dotIdx = fullPath.lastIndexOf('.');
          publicId = dotIdx !== -1 ? fullPath.substring(0, dotIdx) : fullPath;
        }
      } else {
        // Local URL format: http://host:port/uploads/filename.ext
        publicId = path.basename(publicIdOrUrl);
      }
    }

    if (this.isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        this.logger.error(`Failed to delete file ${publicId} from Cloudinary`, error);
      }
    } else {
      try {
        const filePath = path.join(this.localUploadPath, publicId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.error(`Failed to delete local file ${publicId}`, error);
      }
    }
  }

  private async uploadToCloudinary(file: any, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `smile_saviors/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary returned empty result'));
          }

          resolve({
            url: result.secure_url,
            thumbnailUrl: result.resource_type === 'image' 
              ? cloudinary.url(result.public_id, { width: 200, height: 200, crop: 'thumb' })
              : undefined,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  private async uploadToLocal(file: any, folder: string): Promise<UploadResult> {
    const fileExt = path.extname(file.originalname || '');
    const filename = `${folder}_${randomUUID()}${fileExt}`;
    const targetPath = path.join(this.localUploadPath, filename);

    // Write file buffer to local disk
    await fs.promises.writeFile(targetPath, file.buffer);

    const url = `${this.backendUrl}/uploads/${filename}`;
    return {
      url,
      thumbnailUrl: url, // Local fallback uses same URL
      publicId: filename,
    };
  }
}
