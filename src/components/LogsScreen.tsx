import { useState } from 'react';
import { FileText, Trash2, Printer, ChevronDown, ChevronUp, Truck, MapPin } from 'lucide-react';
import { LogEntry, clearLogs } from '@/lib/storage';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface LogsScreenProps {
  logs: LogEntry[];
  onLogsChange: () => void;
}

export function LogsScreen({ logs, onLogsChange }: LogsScreenProps) {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [printingLog, setPrintingLog] = useState<LogEntry | null>(null);

   const handleClearLogs = async () => {
    if (confirm('Limpar todo o histórico de pedidos DO BANCO DE DADOS?')) {
      await api.clearLogs();
      onLogsChange();
      toast.success('Histórico limpo!');
    }
  };

  const handlePrint = (log: LogEntry) => {
    setPrintingLog(log);
    setTimeout(() => {
      window.print();
      setPrintingLog(null);
      toast.success(`Recibo #${log.orderNumber} impresso!`);
    }, 100);
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'dinheiro': return 'Dinheiro';
      case 'cartao': return 'Cartão';
      default: return method;
    }
  };

  const toggleExpand = (orderNumber: number) => {
    setExpandedOrder(expandedOrder === orderNumber ? null : orderNumber);
  };

  if (logs.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <FileText className="w-24 h-24 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-display text-muted-foreground mb-2">NENHUM REGISTRO</h2>
        <p className="text-muted-foreground">Os pedidos finalizados aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-display text-foreground">HISTÓRICO</h2>
          <span className="bg-secondary text-muted-foreground px-3 py-1 rounded-full text-sm">
            {logs.length} registro{logs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleClearLogs}
          className="btn-danger flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpar Histórico
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Nº Pedido</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Data/Hora</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Pagamento</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Total</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <>
                  <tr
                    key={`${log.orderNumber}-${index}`}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(log.orderNumber)}
                  >
                    <td className="p-4">
                      <span className="font-display text-lg text-primary flex items-center gap-2">
                        #{log.orderNumber}
                        {expandedOrder === log.orderNumber ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{log.dateTime}</td>
                    <td className="p-4 text-foreground font-medium flex items-center gap-2">
                      {log.customerName}
                      {log.isDelivery && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm bg-secondary px-2 py-1 rounded">
                        {formatPaymentMethod(log.paymentMethod)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-foreground">
                      R$ {log.total.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(log);
                        }}
                        className="btn-secondary p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                        title="Reimprimir recibo"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === log.orderNumber && log.items && (
                    <tr key={`${log.orderNumber}-details`} className="bg-secondary/20">
                      <td colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Itens do Pedido:</h4>
                            <ul className="space-y-1 text-sm">
                              {log.items.map((item) => (
                                <li key={item.id} className="flex justify-between text-muted-foreground">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            {log.isDelivery && (
                              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                                <span className="text-muted-foreground">Frete</span>
                                <span className="text-foreground">R$ {log.deliveryFee.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Dados do Cliente:</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Nome:</strong> {log.customer.name}</p>
                              {log.customer.phone && (
                                <p><strong>Telefone:</strong> {log.customer.phone}</p>
                              )}
                              {log.isDelivery && log.customer.address && (
                                <p className="flex items-start gap-1">
                                  <MapPin className="w-3 h-3 mt-1 shrink-0" />
                                  {log.customer.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
          <p className="text-2xl font-display text-foreground">{logs.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Faturamento Total</p>
          <p className="text-2xl font-display text-primary">
            R$ {logs.reduce((sum, log) => sum + log.total, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-display text-foreground">
            R$ {(logs.reduce((sum, log) => sum + log.total, 0) / logs.length).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Print Receipt */}
      {printingLog && (
        <div className="receipt">
          <div className="receipt-header">
            <h1>HAMBURGUERIA CENTRAL</h1>
            <p>Rua Principal, 123 - Centro</p>
            <p>Tel: (11) 99999-9999</p>
          </div>
          
          <div className="receipt-divider" />
          
          <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
            PEDIDO #{printingLog.orderNumber}
          </p>
          <p>{printingLog.dateTime}</p>
          
          <div className="receipt-divider" />
          
          <p><strong>Cliente:</strong> {printingLog.customer.name}</p>
          {printingLog.customer.phone && (
            <p><strong>Tel:</strong> {printingLog.customer.phone}</p>
          )}
          {printingLog.isDelivery && printingLog.customer.address && (
            <p><strong>Endereço:</strong> {printingLog.customer.address}</p>
          )}
          
          <div className="receipt-divider" />
          
          <p><strong>ITENS:</strong></p>
          {printingLog.items.map((item) => (
            <div key={item.id} className="receipt-item">
              <span>{item.quantity}x {item.name}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="receipt-divider" />
          
          <div className="receipt-item">
            <span>Subtotal</span>
            <span>R$ {printingLog.subtotal.toFixed(2)}</span>
          </div>
          
          {printingLog.isDelivery && (
            <div className="receipt-item">
              <span>Frete</span>
              <span>R$ {printingLog.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="receipt-total">
            <div className="receipt-item">
              <span>TOTAL</span>
              <span>R$ {printingLog.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="receipt-divider" />
          
          <p><strong>Pagamento:</strong> {formatPaymentMethod(printingLog.paymentMethod)}</p>
          
          <div className="receipt-footer">
            <p>*** REIMPRESSÃO ***</p>
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre!</p>
          </div>
        </div>
      )}
    </div>
  );
}
