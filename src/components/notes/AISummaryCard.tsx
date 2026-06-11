'use client';
import { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { NoteDetail } from '@/types';

interface Props { note: NoteDetail }

export function AISummaryCard({ note }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(note.ai_summary_paragraph);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Summary paragraph */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Summary</CardTitle>
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-gray-700">{note.ai_summary_paragraph}</p>
        </CardContent>
      </Card>

      {/* Bullet points */}
      {note.ai_bullet_points?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {note.ai_bullet_points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key learning points */}
      {note.ai_key_points?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Must Remember</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {note.ai_key_points.map((pt, i) => (
                <div key={i} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800">
                  {pt}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw OCR text — collapsible */}
      {note.raw_ocr_text && (
        <Accordion type="single" collapsible>
          <AccordionItem value="ocr">
            <AccordionTrigger className="text-sm font-medium">
              Original Extracted Text
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-xs text-gray-600">
                {note.raw_ocr_text}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
