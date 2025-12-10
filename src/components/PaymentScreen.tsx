import { useState } from 'react';
import { CreditCard, Banknote, QrCode, Printer, Truck, MapPin } from 'lucide-react';
import { Order, updateOrderStatus, addLog } from '@/lib/storage';
import { toast } from 'sonner';

interface PaymentScreenProps {
  orders: Order[];
  onOrdersChange: () => void;
}

type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'pix', label: 'PIX', icon: QrCode },
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'cartao', label: 'Cartão', icon: CreditCard },
];

export function PaymentScreen({ orders, onOrdersChange }: PaymentScreenProps) {
  const [selectedPayment, setSelectedPayment] = useState<Record<string, PaymentMethod>>({});
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const handlePayment = (order: Order) => {
    const method = selectedPayment[order.id];
    if (!method) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    // Update order with payment method
    updateOrderStatus(order.id, 'completed', method);
    
    // Add to log
    addLog({ ...order, paymentMethod: method });
    
    // Set printing order for receipt
    setPrintingOrder({ ...order, paymentMethod: method });
    
    // Trigger print
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
      onOrdersChange();
      toast.success(`Pedido #${order.orderNumber} finalizado!`);
    }, 100);
  };

  if (orders.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <CreditCard className="w-24 h-24 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-display text-muted-foreground mb-2">NENHUM PAGAMENTO</h2>
        <p className="text-muted-foreground">Aguardando pedidos prontos da cozinha</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-display text-foreground mb-6">PAGAMENTO</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className="order-card animate-slide-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-display text-primary">
                #{order.orderNumber}
              </span>
              <span className="text-xl font-bold text-foreground">
                R$ {order.total.toFixed(2)}
              </span>
            </div>

            <div className="mb-4 pb-4 border-b border-border">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                {order.customer.name}
                {order.isDelivery && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Entrega
                  </span>
                )}
              </h4>
              {order.customer.phone && (
                <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
              )}
              {order.isDelivery && order.customer.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                  <MapPin className="w-3 h-3 mt-1 shrink-0" />
                  {order.customer.address}
                </p>
              )}
            </div>

            <div className="mb-4">
              <ul className="space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-foreground">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              {order.isDelivery && (
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-foreground">R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h5 className="text-sm font-medium text-muted-foreground mb-3">
                Forma de Pagamento
              </h5>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPayment[order.id] === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment({ ...selectedPayment, [order.id]: method.id })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handlePayment(order)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Finalizar e Imprimir
            </button>
          </div>
        ))}
      </div>

      {/* Print Receipt */}
      {printingOrder && (
        <div className="receipt">
          <div className="receipt-header">
            <h1>HAMBURGUERIA CENTRAL</h1>
            <p>Rua Principal, 123 - Centro</p>
            <p>Tel: (11) 99999-9999</p>
          </div>
          
          <div className="receipt-divider" />
          
          <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
            PEDIDO #{printingOrder.orderNumber}
          </p>
          <p>{new Date().toLocaleString('pt-BR')}</p>
          
          <div className="receipt-divider" />
          
          <p><strong>Cliente:</strong> {printingOrder.customer.name}</p>
          {printingOrder.customer.phone && (
            <p><strong>Tel:</strong> {printingOrder.customer.phone}</p>
          )}
          {printingOrder.isDelivery && printingOrder.customer.address && (
            <p><strong>Endereço:</strong> {printingOrder.customer.address}</p>
          )}
          
          <div className="receipt-divider" />
          
          <p><strong>ITENS:</strong></p>
          {printingOrder.items.map((item) => (
            <div key={item.id} className="receipt-item">
              <span>{item.quantity}x {item.name}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="receipt-divider" />
          
          <div className="receipt-item">
            <span>Subtotal</span>
            <span>R$ {printingOrder.subtotal.toFixed(2)}</span>
          </div>
          
          {printingOrder.isDelivery && (
            <div className="receipt-item">
              <span>Frete</span>
              <span>R$ {printingOrder.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="receipt-total">
            <div className="receipt-item">
              <span>TOTAL</span>
              <span>R$ {printingOrder.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="receipt-divider" />
          
          <p><strong>Pagamento:</strong> {
            printingOrder.paymentMethod === 'pix' ? 'PIX' :
            printingOrder.paymentMethod === 'dinheiro' ? 'Dinheiro' :
            printingOrder.paymentMethod === 'cartao' ? 'Cartão' : 'N/A'
          }</p>
          
          <div className="receipt-footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre!</p>
          </div>
        </div>
      )}
    </div>
  );
}
