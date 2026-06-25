export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  publicId: string;
}

export interface IFileUploadService {
  upload(file: any, folder: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
