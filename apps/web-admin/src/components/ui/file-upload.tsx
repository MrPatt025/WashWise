"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
  Image,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface FileWithPreview extends File {
  preview?: string;
  id: string;
  progress?: number;
  status?: "pending" | "uploading" | "success" | "error";
  error?: string;
}

type AcceptedFileType =
  | "image/*"
  | "video/*"
  | "audio/*"
  | "application/pdf"
  | ".doc,.docx"
  | ".xls,.xlsx"
  | ".zip,.rar"
  | string;

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(file: File) {
  const type = file.type;

  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  if (type === "application/pdf") return FileText;
  if (type.includes("zip") || type.includes("rar")) return FileArchive;
  return File;
}

// ============================================================================
// File Dropzone
// ============================================================================

interface FileDropzoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  accept?: AcceptedFileType[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileDropzone({
  onFilesSelected,
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
  disabled = false,
  className,
  children,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const filesArray = Array.from(fileList).slice(0, maxFiles);
      const processedFiles: FileWithPreview[] = filesArray
        .filter((file) => {
          if (maxSize && file.size > maxSize) {
            console.warn(
              `File ${file.name} exceeds max size of ${formatFileSize(maxSize)}`,
            );
            return false;
          }
          return true;
        })
        .map((file) => {
          const fileWithPreview = Object.assign(file, {
            id: generateId(),
            preview: file.type.startsWith("image/")
              ? URL.createObjectURL(file)
              : undefined,
            status: "pending" as const,
            progress: 0,
          });
          return fileWithPreview;
        });

      onFilesSelected(processedFiles);
    },
    [maxFiles, maxSize, onFilesSelected],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;
      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles],
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [processFiles],
  );

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFilePicker}
      className={cn(
        "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
        isDragActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept?.join(",")}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {children || (
        <>
          <motion.div
            animate={{ scale: isDragActive ? 1.1 : 1 }}
            className={cn(
              "p-4 rounded-full mb-4",
              isDragActive
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "bg-gray-100 dark:bg-gray-800",
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8",
                isDragActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400",
              )}
            />
          </motion.div>

          <p className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to browse
          </p>

          {(accept || maxSize) && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {accept && `Accepted: ${accept.join(", ")}`}
              {accept && maxSize && " • "}
              {maxSize && `Max size: ${formatFileSize(maxSize)}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// File Preview
// ============================================================================

interface FilePreviewProps {
  file: FileWithPreview;
  onRemove?: (id: string) => void;
  onPreview?: (file: FileWithPreview) => void;
  showProgress?: boolean;
  className?: string;
}

export function FilePreview({
  file,
  onRemove,
  onPreview,
  showProgress = true,
  className,
}: FilePreviewProps) {
  const FileIcon = getFileIcon(file);
  const isImage = file.type.startsWith("image/");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg",
        className,
      )}
    >
      {/* Preview/Icon */}
      <div className="flex-shrink-0">
        {isImage && file.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.preview}
            alt={file.name}
            className="w-12 h-12 object-cover rounded-md"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md">
            <FileIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>

        {/* Progress Bar */}
        {showProgress && file.status === "uploading" && (
          <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        )}

        {/* Error Message */}
        {file.status === "error" && file.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {file.error}
          </p>
        )}
      </div>

      {/* Status/Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {file.status === "uploading" && (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        )}

        {file.status === "success" && (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}

        {file.status === "error" && (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}

        {onPreview && isImage && (
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// File List
// ============================================================================

interface FileListProps {
  files: FileWithPreview[];
  onRemove?: (id: string) => void;
  onPreview?: (file: FileWithPreview) => void;
  onClearAll?: () => void;
  showProgress?: boolean;
  className?: string;
}

export function FileList({
  files,
  onRemove,
  onPreview,
  onClearAll,
  showProgress = true,
  className,
}: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {files.length > 1 && onClearAll && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear all
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <FilePreview
            key={file.id}
            file={file}
            onRemove={onRemove}
            onPreview={onPreview}
            showProgress={showProgress}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Avatar Upload
// ============================================================================

interface AvatarUploadProps {
  value?: string;
  onChange?: (file: File | null) => void;
  size?: number;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export function AvatarUpload({
  value,
  onChange,
  size = 100,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  name,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = React.useState<string | undefined>(value);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];

    if (!file) {
      setPreview(value);
      onChange?.(null);
      return;
    }

    if (maxSize && file.size > maxSize) {
      setError(`File must be smaller than ${formatFileSize(maxSize)}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onChange?.(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label="Upload avatar"
      />

      <div
        style={{ width: size, height: size }}
        className={cn(
          "relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600",
          !disabled &&
            "cursor-pointer hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={name || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Upload className="w-1/3 h-1/3 text-gray-400" />
          </div>
        )}

        {/* Overlay on hover */}
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <Upload className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Remove button */}
      {preview && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// Image Gallery Upload
// ============================================================================

interface ImageGalleryUploadProps {
  value?: string[];
  onChange?: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageGalleryUpload({
  value: _value = [],
  onChange,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  disabled = false,
  className,
}: ImageGalleryUploadProps) {
  const [files, setFiles] = React.useState<FileWithPreview[]>([]);

  const handleFilesSelected = (newFiles: FileWithPreview[]) => {
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const handleRemove = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    const currentFiles = files;
    return () => {
      currentFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={cn("space-y-4", className)}>
      {files.length < maxFiles && (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept={["image/*"]}
          maxFiles={maxFiles - files.length}
          maxSize={maxSize}
          disabled={disabled}
          className="min-h-[150px]"
        />
      )}

      {/* Gallery Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status badge */}
                {file.status === "uploading" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {files.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {files.length} of {maxFiles} images
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Complete File Upload Component
// ============================================================================

interface FileUploadProps {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  accept?: AcceptedFileType[];
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  showList?: boolean;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  accept,
  maxFiles = 10,
  maxSize,
  multiple = true,
  disabled = false,
  showList = true,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<FileWithPreview[]>(value);

  React.useEffect(() => {
    setFiles(value);
  }, [value]);

  const handleFilesSelected = (newFiles: FileWithPreview[]) => {
    const updatedFiles = multiple
      ? [...files, ...newFiles].slice(0, maxFiles)
      : newFiles.slice(0, 1);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const handleRemove = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const handleClearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    onChange?.([]);
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    const currentFiles = files;
    return () => {
      currentFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const canAddMore = multiple ? files.length < maxFiles : files.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {canAddMore && (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          accept={accept}
          maxFiles={multiple ? maxFiles - files.length : 1}
          maxSize={maxSize}
          multiple={multiple}
          disabled={disabled}
        />
      )}

      {showList && (
        <FileList
          files={files}
          onRemove={handleRemove}
          onClearAll={files.length > 1 ? handleClearAll : undefined}
        />
      )}
    </div>
  );
}
