'use client';

import { useRef, useState } from 'react';
import { useBudgetStore } from '@/lib/store';
import { CATEGORIES } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { TransactionCategory } from '@/types';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  type: 'expense' | 'deposit';
  error?: string;
}

const VALID_CATEGORIES = new Set<string>(CATEGORIES);

function parseRow(raw: string[], lineNum: number): ParsedRow {
  const [date, description, amountStr, category, type] = raw.map((s) => s.trim());

  const errors: string[] = [];

  const parsedDate = new Date(date);
  if (!date || isNaN(parsedDate.getTime())) errors.push('invalid date');

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) errors.push('invalid amount');

  if (!VALID_CATEGORIES.has(category)) errors.push(`unknown category "${category}"`);

  const parsedType = type?.toLowerCase();
  if (parsedType !== 'expense' && parsedType !== 'deposit') errors.push('type must be expense or deposit');

  if (errors.length > 0) {
    return {
      date, description: description ?? '', amount: amount || 0,
      category: (VALID_CATEGORIES.has(category) ? category : 'Other') as TransactionCategory,
      type: parsedType === 'deposit' ? 'deposit' : 'expense',
      error: `Row ${lineNum}: ${errors.join(', ')}`,
    };
  }

  return {
    date: parsedDate.toISOString(),
    description,
    amount,
    category: category as TransactionCategory,
    type: parsedType as 'expense' | 'deposit',
  };
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  // Skip header if first line looks like a header
  const start = lines[0]?.toLowerCase().includes('date') ? 1 : 0;
  return lines.slice(start).map((line, i) => {
    // Handle quoted fields
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur);
    return parseRow(cols, start + i + 1);
  });
}

interface Props {
  onDone?: () => void;
}

export default function CsvImport({ onDone }: Props) {
  const { addTransaction } = useBudgetStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCsv(text));
    };
    reader.readAsText(file);
  }

  const validRows = rows?.filter((r) => !r.error) ?? [];
  const errorRows = rows?.filter((r) => r.error) ?? [];

  function handleImport() {
    for (const row of validRows) {
      addTransaction({
        amount: row.amount,
        description: row.description,
        date: row.date,
        category: row.category,
        type: row.type,
      });
    }
    toast.success(`Imported ${validRows.length} transaction${validRows.length !== 1 ? 's' : ''}`);
    setRows(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
    onDone?.();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          CSV format: <code className="text-xs bg-muted px-1 py-0.5 rounded">date, description, amount, category, type</code>
        </p>
        <p className="text-xs text-muted-foreground">
          Type: <strong>expense</strong> or <strong>deposit</strong> · Categories: {CATEGORIES.join(', ')}
        </p>
      </div>

      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          {fileName ? fileName : 'Click to select a CSV file'}
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </div>

      {rows && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{validRows.length} valid rows</span>
            {errorRows.length > 0 && (
              <>
                <XCircle className="w-4 h-4 text-rose-500 ml-2" />
                <span className="text-rose-500">{errorRows.length} errors (will be skipped)</span>
              </>
            )}
          </div>

          {errorRows.length > 0 && (
            <div className="rounded-md bg-rose-50 dark:bg-rose-950/30 p-3 space-y-1 max-h-32 overflow-y-auto">
              {errorRows.map((r, i) => (
                <p key={i} className="text-xs text-rose-600 dark:text-rose-400">{r.error}</p>
              ))}
            </div>
          )}

          {validRows.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto divide-y divide-border text-xs">
              {validRows.slice(0, 20).map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Badge variant={r.type === 'expense' ? 'destructive' : 'default'} className="text-[10px] h-4 shrink-0">
                    {r.type}
                  </Badge>
                  <span className="flex-1 truncate text-muted-foreground">{r.description}</span>
                  <span className="shrink-0">{r.category}</span>
                  <span className="font-semibold shrink-0">${r.amount.toFixed(2)}</span>
                </div>
              ))}
              {validRows.length > 20 && (
                <p className="text-center py-2 text-muted-foreground">…and {validRows.length - 20} more</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={validRows.length === 0} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Import {validRows.length} Transaction{validRows.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={() => { setRows(null); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
