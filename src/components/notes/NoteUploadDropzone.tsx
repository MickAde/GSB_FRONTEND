'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

const ACCEPT = {
  'application/pdf':  ['.pdf'],
  'image/jpeg':       ['.jpg', '.jpeg'],
  'image/png':        ['.png'],
  'image/webp':       ['.webp'],
  'image/gif':        ['.gif'],
  'image/tiff':       ['.tiff'],
  'audio/mpeg':       ['.mp3'],
  'audio/mp4':        ['.mp4'],
  'audio/wav':        ['.wav'],
  'audio/ogg':        ['.ogg'],
  'audio/webm':       ['.webm'],
  'text/plain':       ['.txt'],
};

interface Props {
  onFile:   (file: File) => void;
  file?:    File | null;
  onClear?: () => void;
  disabled?: boolean;
}

export function NoteUploadDropzone({ onFile, file, onClear, disabled }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) onFile(accepted[0]); },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept:   ACCEPT,
    maxSize:  20 * 1024 * 1024,
    maxFiles: 1,
    disabled,
  });

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <File className="h-8 w-8 text-green-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
        {onClear && (
          <button onClick={onClear} className="rounded-full p-1 hover:bg-green-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors',
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-3 h-10 w-10 text-gray-400" />
        <p className="font-medium text-gray-700">
          {isDragActive ? 'Drop your file here' : 'Drag & drop your note here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-gray-400">PDF, Images (JPG/PNG/WEBP), Audio (MP3/WAV), or Text — max 20MB</p>
      </div>
      {fileRejections.length > 0 && (
        <p className="mt-2 text-xs text-red-500">
          {fileRejections[0]?.errors[0]?.code === 'file-too-large'
            ? 'File is too large. Maximum size is 20MB.'
            : 'File type not supported.'}
        </p>
      )}
    </div>
  );
}
