import { useState } from 'react';
import { Check, CreditCard, Banknote, DollarSign, Loader2, Clock } from 'lucide-react';
import { Order, updateOrderStatus } from '@/lib/storage'; // Funções locais
import { api } from '@/services/api'; // Nossa conexão com o Google Sheets
import { toast } from 'sonner';

interface PaymentScreenProps {
  orders: Order[];
  onOrdersChange: () => void;
}

export function PaymentScreen({ orders, onOrdersChange }: PaymentScreenProps) {
  // Estado para controlar qual pedido está sendo enviado no momento (Loading)
  const [sendingId, setSendingId] = useState<string | null>(null);
  
  // Estado para armazenar a forma de pagamento escolhida para cada pedido
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  const handlePaymentMethodChange = (orderId: string, method: string) => {
    setPaymentMethods(prev => ({ ...prev, [orderId]: method }));
  };

  const handleFinalize = async (order: Order) => {
    const metodoPagamento = paymentMethods[order.id];

    if (!metodoPagamento) {
      toast.error('Selecione a forma de pagamento!');
      return;
    }

    setSendingId(order.id); // Ativa o loading

    try {
      // 1. Prepara os dados formatados para a Planilha
      const resumoItens = order.items
        .map(item => `${item.quantity}x ${item.name}`)
        .join('\n');

      const dadosParaPlanilha = {
        id_pedido: `#${order.orderNumber}`,
        cliente: {
          nome: order.customer.name,
          telefone: order.customer.phone,
          endereco_rua: order.isDelivery ? order.customer.address : "Retirada no Balcão",
          endereco_numero: "", // Se tiver separado, coloque aqui
          bairro: "" 
        },
        tipo_entrega: order.isDelivery ? "Delivery" : "Retirada",
        forma_pagto: metodoPagamento, // Usa o que foi selecionado na tela
        total: order.total,
        resumo_itens: resumoItens,
        obs: "" // Se tiver observação no pedido, adicione aqui
      };

      // 2. Envia para o Google Sheets (Aba Histórico)
      const sucesso = await api.createOrder(dadosParaPlanilha);

      if (sucesso) {
        // 3. Atualiza localmente para "completed" (some da tela de pagamento)
        updateOrderStatus(order.id, 'completed');
        onOrdersChange();
        toast.success(`Pedido #${order.orderNumber} finalizado e salvo no Histórico!`);
      } else {
        toast.error('Erro ao salvar na planilha. Tente novamente.');
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro de conexão.");
    } finally {
      setSendingId(null); // Desativa o loading
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
        <Check className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-2xl font-display">Tudo pago por aqui!</h2>
        <p>Nenhum pedido aguardando pagamento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-display text-foreground mb-6">PAGAMENTOS PENDENTES</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              
              {/* Coluna da Esquerda: Dados do Pedido */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                    #{order.orderNumber}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {order.isDelivery && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                      DELIVERY
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg">{order.customer.name}</h3>
                  <p className="text-muted-foreground text-sm">{order.customer.address || "Retirada"}</p>
                </div>

                <div className="bg-secondary/50 p-3 rounded-lg text-sm space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-muted-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Coluna da Direita: Pagamento e Ação */}
              <div className="md:w-72 space-y-4 flex flex-col justify-center border-l border-border pl-0 md:pl-6">
                <label className="text-sm font-semibold text-muted-foreground">Forma de Pagamento:</label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePaymentMethodChange(order.id, 'Dinheiro')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      paymentMethods[order.id] === 'Dinheiro' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Dinheiro</span>
                  </button>

                  <button
                    onClick={() => handlePaymentMethodChange(order.id, 'Pix')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      paymentMethods[order.id] === 'Pix' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs">Pix</span>
                  </button>

                  <button
                    onClick={() => handlePaymentMethodChange(order.id, 'Cartão')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      paymentMethods[order.id] === 'Cartão' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Cartão</span>
                  </button>
                </div>

                <button
                  onClick={() => handleFinalize(order)}
                  disabled={sendingId === order.id}
                  className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2 mt-2"
                >
                  {sendingId === order.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Finalizar Pedido
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
