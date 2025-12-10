import { useState } from 'react';
import { Check, CreditCard, Banknote, DollarSign, Loader2, Clock } from 'lucide-react';
import { Order, updateOrderStatus } from '@/lib/storage';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface PaymentScreenProps {
  orders: Order[];
  onOrdersChange: () => void;
}

export function PaymentScreen({ orders, onOrdersChange }: PaymentScreenProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  const handleFinalize = async (order: Order) => {
    const metodo = paymentMethods[order.id];
    if (!metodo) return toast.error('Selecione a forma de pagamento!');

    setSendingId(order.id);

    try {
      // 1. Envia para Google Sheets (Backup e Histórico)
      const sucesso = await api.createOrder({
        id_pedido: `#${order.orderNumber}`,
        cliente: {
          nome: order.customer.name,
          telefone: order.customer.phone,
          endereco_rua: order.customer.address,
        },
        tipo_entrega: order.isDelivery ? "Delivery" : "Retirada",
        forma_pagto: metodo,
        total: order.total,
        resumo_itens: order.items.map(i => `${i.quantity}x ${i.name}`).join('\n'),
        obs: ""
      });

      if (sucesso) {
        // 2. Mover para a COZINHA (não completed)
        updateOrderStatus(order.id, 'kitchen'); // <--- ISSO É IMPORTANTE
        
        toast.success(`Pedido #${order.orderNumber} enviado para a Cozinha!`);
        onOrdersChange();
      } else {
        toast.error('Erro ao conectar com planilha.');
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setSendingId(null);
    }
  };

  if (orders.length === 0) return <div className="text-center py-20 text-muted-foreground">Sem pagamentos pendentes.</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-3xl font-display text-foreground">PAGAMENTO</h2>
      {orders.map((order) => (
        <div key={order.id} className="bg-card border border-border p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">#{order.orderNumber} - {order.customer.name}</h3>
              <p className="text-sm text-muted-foreground">Total: R$ {order.total.toFixed(2)}</p>
            </div>
            {order.isDelivery && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Entrega</span>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['Dinheiro', 'Pix', 'Cartão'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethods(p => ({ ...p, [order.id]: method }))}
                className={`p-2 border rounded transition-colors ${paymentMethods[order.id] === method ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-secondary'}`}
              >
                {method}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleFinalize(order)} 
            disabled={sendingId === order.id}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {sendingId === order.id ? <Loader2 className="animate-spin" /> : "Confirmar e Enviar p/ Cozinha"}
          </button>
        </div>
      ))}
    </div>
  );
}
