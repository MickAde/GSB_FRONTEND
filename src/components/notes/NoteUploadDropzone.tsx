'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileCheck, X, Files } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

const ACCEPT = {
  'application/pdf':  ['.pdf'],
  'image/jpeg':       ['.jpg', '.jpeg'],
  'image/png':        ['.png'],
  'image/webp':       ['.webp'],
  'image/gif':        ['.gif'],
  'image/tiff':       ['.tiff', '.tif'],
  'image/heic':       ['.heic'],
  'image/heif':       ['.heif'],
  'image/bmp':        ['.bmp'],
  'audio/mpeg':       ['.mp3'],
  'audio/mp4':        ['.m4a'],
  'audio/wav':        ['.wav'],
  'audio/ogg':        ['.ogg'],
  'audio/webm':       ['.webm'],
  'audio/aac':        ['.aac'],
  'text/plain':       ['.txt'],
  // Office documents
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const FILE_TYPE_HINTS = [
  { emoji: '📄', label: 'PDF' },
  { emoji: '📷', label: 'Photo' },
  { emoji: '🎤', label: 'Audio' },
  { emoji: '📝', label: 'Text' },
  { emoji: '📊', label: 'Word/PPT' },
];

interface Props {
  onFiles:   (files: File[]) => void;
  files?:    File[];
  onClear?:  (index?: number) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function NoteUploadDropzone({ onFiles, files = [], onClear, disabled, maxFiles = 10 }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted.length) onFiles(accepted); },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept:   ACCEPT,
    maxSize:  20 * 1024 * 1024,
    maxFiles,
    disabled,
    multiple: maxFiles > 1,
  });

  if (files.length > 0) {
    return (
      <div className="space-y-2">
        {files.map((file, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <FileCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} · Ready to upload</p>
            </div>
            {onClear && (
              <button
                onClick={() => onClear(i)}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-emerald-100 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {/* Allow adding more files if under limit */}
        {maxFiles > 1 && files.length < maxFiles && (
          <div
            {...getRootProps()}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <input {...getInputProps()} />
            <Files className="h-4 w-4 shrink-0" />
            <span>Add more files ({files.length}/{maxFiles})</span>
          </div>
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
          {isDragActive ? 'Drop it here!' : 'Drag your notes here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {maxFiles > 1 ? `Up to ${maxFiles} files · ` : ''}Maximum 20 MB per file
        </p>

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
            : fileRejections[0]?.errors[0]?.code === 'too-many-files'
            ? `You can upload a maximum of ${maxFiles} files at once.`
            : 'That file type is not supported.'}
        </p>
      )}
    </div>
  );
}
