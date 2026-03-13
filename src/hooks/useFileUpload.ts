import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onUpload?: (files: File[]) => Promise<void>;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

export function useFileUpload({
  maxSize = 5 * 1024 * 1024,
  allowedTypes = ['image/*', 'application/pdf'],
  maxFiles = 10,
  onUpload,
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `Le fichier est trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
      }

      const fileType = file.type;
      const isAllowed = allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType);
        }
        return fileType === type;
      });

      if (!isAllowed) {
        return 'Type de fichier non autorisé';
      }

      return null;
    },
    [maxSize, allowedTypes]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        if (files.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} fichiers autorisés`);
          break;
        }

        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          const uploadedFile: UploadedFile = { file };

          if (file.type.startsWith('image/')) {
            uploadedFile.preview = URL.createObjectURL(file);
          }

          validFiles.push(uploadedFile);
        }
      }

      if (errors.length > 0) {
        toast.error(errors.join('\n'));
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [files.length, maxFiles, validateFile]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];

      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }

      return newFiles;
    });
  }, []);

  const uploadFiles = useCallback(async () => {
    if (!onUpload || files.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(files.map((f) => f.file));
      toast.success('Fichiers téléchargés avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement des fichiers');
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [files, onUpload]);

  const clearFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
  }, [files]);

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadFiles,
    clearFiles,
    hasFiles: files.length > 0,
    fileCount: files.length,
  };
}
