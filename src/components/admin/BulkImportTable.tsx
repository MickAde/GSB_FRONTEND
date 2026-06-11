'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Download, CheckCircle2, XCircle } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { bulkCreateStudents } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type { BulkStudentRow, BulkCreateResult } from '@/types';

type Step = 'input' | 'preview' | 'results';

function parseCSV(text: string): BulkStudentRow[] {
  const lines = text.trim().split('\n').slice(1); // skip header
  return lines
    .map((line) => {
      const [first_name = '', last_name = '', username = '', password = '', email = ''] = line.split(',').map((s) => s.trim());
      return { first_name, last_name, username, password, email: email || undefined } as BulkStudentRow;
    })
    .filter((r) => r.first_name || r.username);
}

const CSV_TEMPLATE = 'first_name,last_name,username,password,email\nJohn,Doe,ADM/2024/001,Password123,\n';

export function BulkImportTable() {
  const qc   = useQueryClient();
  const [step, setStep]       = useState<Step>('input');
  const [csvText, setCsvText] = useState('');
  const [rows, setRows]       = useState<BulkStudentRow[]>([]);
  const [result, setResult]   = useState<BulkCreateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setCsvText((e.target?.result as string) ?? '');
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handlePreview = () => {
    const parsed = parseCSV(csvText);
    if (!parsed.length) { toast.error('No valid rows found in CSV'); return; }
    setRows(parsed);
    setStep('preview');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await bulkCreateStudents({ students: rows });
      setResult(res);
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers.all() });
      setStep('results');
    } catch {
      toast.error('Import failed. Please check your CSV and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'student_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFailures = () => {
    if (!result?.failed.length) return;
    const header = 'username,error\n';
    const body   = result.failed.map((f) => `${f.username},${f.error}`).join('\n');
    const blob   = new Blob([header + body], { type: 'text/csv' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = 'import_failures.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'results' && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-gray-50 p-4 text-center">
          <p className="text-lg font-semibold">
            <span className="text-green-600">{result.created.length} imported</span>
            {result.failed.length > 0 && (
              <>, <span className="text-red-500">{result.failed.length} failed</span></>
            )}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.created.map((u) => (
              <TableRow key={u.id} className="bg-green-50">
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
                <TableCell>{u.first_name} {u.last_name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            ))}
            {result.failed.map((f, i) => (
              <TableRow key={i} className="bg-red-50">
                <TableCell><XCircle className="h-4 w-4 text-red-500" /></TableCell>
                <TableCell>—</TableCell>
                <TableCell>{f.username}</TableCell>
                <TableCell className="text-xs text-red-600">{f.error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {result.failed.length > 0 && (
          <Button variant="outline" onClick={downloadFailures}>
            <Download className="mr-2 h-4 w-4" /> Download failure report
          </Button>
        )}
        <Button onClick={() => { setStep('input'); setCsvText(''); setRows([]); setResult(null); }}>
          Import More Students
        </Button>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{rows.length} students ready to import.</p>
        <div className="max-h-96 overflow-y-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.first_name}</TableCell>
                  <TableCell>{row.last_name}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{row.email ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('input')}>← Back</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? 'Importing…' : `Import ${rows.length} Students`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" /> Download CSV Template
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600">Drop a CSV file here, or click to browse</p>
      </div>

      <p className="text-center text-xs text-gray-400">or paste CSV text below</p>

      <Textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={6}
        placeholder="first_name,last_name,username,password,email&#10;John,Doe,ADM/2024/001,Password123,"
        className="font-mono text-xs"
      />

      <Button onClick={handlePreview} disabled={!csvText.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700">
        Preview Import
      </Button>
    </div>
  );
}
