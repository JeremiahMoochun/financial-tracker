/** CSV template for ClearPath baseline (open in Excel / Sheets). */

export const BASELINE_CSV_HEADER =
  'record_type,name_or_category,description,monthly_amount,balance_or_target,notes';

export type BaselineCsvPayload = {
  jobTitle: string;
  monthlyTakeHome: string;
  expenseRows: { id: string; category: string; description: string; monthly: string }[];
  debtRows: { id: string; name: string; balance: string; notes: string }[];
  savingsRows: { id: string; label: string; target: string }[];
};

function escapeCsvCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function exportBaselineCsv(p: BaselineCsvPayload): string {
  const lines: string[] = [BASELINE_CSV_HEADER];
  lines.push(
    [
      'income',
      escapeCsvCell(p.jobTitle || 'Your job title'),
      'Monthly take-home',
      escapeCsvCell(p.monthlyTakeHome || '0'),
      '',
      '',
    ].join(',')
  );
  for (const r of p.expenseRows) {
    const m = Number(r.monthly);
    if (!r.category.trim() && !(m > 0)) continue;
    lines.push(
      [
        'expense',
        escapeCsvCell(r.category || 'Other'),
        escapeCsvCell(r.description || ''),
        escapeCsvCell(r.monthly || '0'),
        '',
        '',
      ].join(',')
    );
  }
  for (const r of p.debtRows) {
    const b = Number(r.balance);
    if (!r.name.trim() && !(b > 0)) continue;
    lines.push(
      [
        'debt',
        escapeCsvCell(r.name || ''),
        '',
        '',
        escapeCsvCell(r.balance || '0'),
        escapeCsvCell(r.notes || ''),
      ].join(',')
    );
  }
  for (const r of p.savingsRows) {
    const t = Number(r.target);
    if (!r.label.trim() && !(t > 0)) continue;
    lines.push(
      [
        'savings',
        escapeCsvCell(r.label || ''),
        '',
        '',
        escapeCsvCell(r.target || '0'),
        '',
      ].join(',')
    );
  }
  return '\uFEFF' + lines.join('\r\n');
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ',') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export function importBaselineCsv(text: string): Partial<BaselineCsvPayload> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return {};

  const expenseRows: BaselineCsvPayload['expenseRows'] = [];
  const debtRows: BaselineCsvPayload['debtRows'] = [];
  const savingsRows: BaselineCsvPayload['savingsRows'] = [];

  let jobTitle = '';
  let monthlyTakeHome = '';

  const mkId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 4) continue;
    const type = (cells[0] || '').toLowerCase();
    const name = cells[1] || '';
    const description = cells[2] || '';
    const monthly = cells[3] || '';
    const balanceOrTarget = cells[4] || '';
    const notes = cells[5] || '';

    if (type === 'income') {
      jobTitle = name;
      monthlyTakeHome = monthly;
    } else if (type === 'expense') {
      expenseRows.push({
        id: mkId(),
        category: name || 'Other',
        description,
        monthly,
      });
    } else if (type === 'debt') {
      debtRows.push({
        id: mkId(),
        name,
        balance: balanceOrTarget || monthly,
        notes,
      });
    } else if (type === 'savings') {
      savingsRows.push({
        id: mkId(),
        label: name,
        target: balanceOrTarget || monthly,
      });
    }
  }

  return { jobTitle, monthlyTakeHome, expenseRows, debtRows, savingsRows };
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
