'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileCheck, X } from 'lucide-react';
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

const FILE_TYPE_HINTS = [
  { emoji: '📄', label: 'PDF' },
  { emoji: '📷', label: 'Photo' },
  { emoji: '🎤', label: 'Audio' },
  { emoji: '📝', label: 'Text' },
];

interface Props {
  onFile:    (file: File) => void;
  file?:     File | null;
  onClear?:  () => void;
  disabled?: boolean;
}

export function NoteUploadDropzone({ onFile, file, onClear, disabled }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) onFile(accepted[0]); },
    [onFile],
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
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <FileCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} · Ready to upload</p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-emerald-100 hover:text-foreground"
          >
            <X className="h-4 w-4" />
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
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className={cn(
            'mb-3 h-12 w-12 transition-colors',
            isDragActive ? 'text-primary' : 'text-muted-foreground/40',
          )}
        />
        <p className="font-semibold text-foreground/80">
          {isDragActive ? 'Drop it here!' : 'Drag your note here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Maximum file size: 20 MB</p>

        {/* File type hints */}
        <div className="mt-4 flex items-center gap-3">
          {FILE_TYPE_HINTS.map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-lg">{emoji}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <p className="mt-2 text-xs text-red-500">
          {fileRejections[0]?.errors[0]?.code === 'file-too-large'
            ? 'File is too large. Maximum size is 20 MB.'
            : 'That file type is not supported. Try a PDF, image, audio, or text file.'}
        </p>
      )}
    </div>
  );
}
