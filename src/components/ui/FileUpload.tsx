import React, { useCallback, useRef } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

interface FileUploadProps {
  label?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  helperText?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  accept = 'image/*,application/pdf',
  multiple = true,
  maxSize = 5 * 1024 * 1024,
  files,
  onFilesChange,
  disabled = false,
  helperText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const processFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      const validFiles: UploadedFile[] = [];

      fileArray.forEach((file) => {
        if (file.size > maxSize) {
          return;
        }

        const uploadedFile: UploadedFile = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        };

        if (file.type.startsWith('image/')) {
          uploadedFile.preview = URL.createObjectURL(file);
        }

        validFiles.push(uploadedFile);
      });

      if (validFiles.length > 0) {
        const newFilesList = multiple ? [...files, ...validFiles] : validFiles;
        onFilesChange(newFilesList);
      }
    },
    [files, multiple, maxSize, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const fileToRemove = files.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6
          transition-all duration-200
          ${isDragging
            ? 'border-accent bg-blue-50'
            : error
            ? 'border-red-500'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="w-10 h-10 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Cliquez pour choisir ou glissez vos fichiers ici
          </p>
          {helperText && (
            <p className="text-xs text-gray-500">{helperText}</p>
          )}
          <p className="text-xs text-gray-500">
            Taille max: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
            >
              {uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt={uploadedFile.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <FileIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(uploadedFile.id);
                }}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
