import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface EntidadeFilhoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (items: { codesc_pai: string; codesc_filho: string; nome: string }[]) => void;
}

interface ParsedItem {
  codesc_pai: string;
  codesc_filho: string;
  nome: string;
  valid: boolean;
  errors: string[];
}

export function EntidadeFilhoUploadDialog({ open, onOpenChange, onUpload }: EntidadeFilhoUploadDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const parsed: ParsedItem[] = jsonData.map((row: any) => {
          const errors: string[] = [];
          const codesc_pai = String(row['CODESC_PAI'] || row['codesc_pai'] || '').trim();
          const codesc_filho = String(row['CODESC_FILHO'] || row['codesc_filho'] || '').trim();
          const nome = String(row['NOMESC_FILHO'] || row['nomesc_filho'] || row['NOME'] || row['nome'] || '').trim();

          if (!codesc_pai) errors.push('CODESC_PAI obrigatório');
          if (!codesc_filho) errors.push('CODESC_FILHO obrigatório');
          if (!nome) errors.push('NOMESC_FILHO obrigatório');

          return { codesc_pai, codesc_filho, nome, valid: errors.length === 0, errors };
        });

        setParsedData(parsed);
      } catch {
        toast.error('Erro ao processar arquivo. Verifique o formato.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const template = [
      { CODESC_PAI: '123456', CODESC_FILHO: 'EF001', NOMESC_FILHO: 'Escola Municipal Exemplo' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entidades Filho');
    XLSX.writeFile(wb, 'modelo_entidades_filho.xlsx');
  };

  const handleConfirmUpload = () => {
    const validData = parsedData.filter(item => item.valid);
    if (validData.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }
    onUpload(validData.map(({ valid, errors, ...item }) => item));
    setParsedData([]);
    onOpenChange(false);
  };

  const validCount = parsedData.filter(item => item.valid).length;
  const invalidCount = parsedData.filter(item => !item.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Entidades Filho em Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Formato do arquivo:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>CODESC_PAI</strong>: Código da entidade pai (obrigatório)</li>
              <li><strong>CODESC_FILHO</strong>: Código da entidade filho (obrigatório)</li>
              <li><strong>NOMESC_FILHO</strong>: Nome da entidade filho (obrigatório)</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={handleDownloadTemplate} className="btn-outline flex items-center gap-2">
              <Download size={16} />
              Baixar Modelo
            </button>
            <label className="btn-primary flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              Selecionar Arquivo
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {parsedData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium">Prévia dos dados:</span>
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle size={14} />
                  {validCount} válido(s)
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-error">
                    <AlertCircle size={14} />
                    {invalidCount} com erro(s)
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">CODESC Pai</th>
                      <th className="p-2 text-left">CODESC Filho</th>
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, index) => (
                      <tr key={index} className={`border-t border-border ${!item.valid ? 'bg-error/5' : ''}`}>
                        <td className="p-2">
                          {item.valid ? (
                            <CheckCircle size={16} className="text-success" />
                          ) : (
                            <AlertCircle size={16} className="text-error" />
                          )}
                        </td>
                        <td className="p-2 font-mono">{item.codesc_pai}</td>
                        <td className="p-2 font-mono">{item.codesc_filho}</td>
                        <td className="p-2">{item.nome}</td>
                        <td className="p-2 text-error">{item.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setParsedData([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={validCount === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Importar {validCount} Registro(s)
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
