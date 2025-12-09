import { useState } from 'react';
import { ChefHat, Clock, CheckCircle, Truck, MapPin, Loader2 } from 'lucide-react';
import { Order, updateOrderStatus } from '@/lib/api';
import { toast } from 'sonner';

interface KitchenScreenProps {
  orders: Order[];
  onOrdersChange: () => void;
}

export function KitchenScreen({ orders, onOrdersChange }: KitchenScreenProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleOrderReady = async (order: Order) => {
    setProcessingId(order.id);
    try {
      await updateOrderStatus(order.id, 'payment');
      await onOrdersChange();
      toast.success(`Pedido #${order.orderNumber} pronto para pagamento!`);
    } catch (error) {
      toast.error('Erro ao atualizar pedido. Tente novamente.');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <ChefHat className="w-24 h-24 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-display text-muted-foreground mb-2">NENHUM PEDIDO</h2>
        <p className="text-muted-foreground">Aguardando novos pedidos da cozinha</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-3xl font-display text-foreground">COZINHA</h2>
        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className="order-card animate-slide-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-display text-primary">
                #{order.orderNumber}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                {order.customer.name}
                {order.isDelivery && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Entrega
                  </span>
                )}
              </h4>
              {order.isDelivery && order.customer.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                  <MapPin className="w-3 h-3 mt-1 shrink-0" />
                  {order.customer.address}
                </p>
              )}
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 mb-4">
              <h5 className="text-xs uppercase text-muted-foreground font-medium mb-2">
                Itens do Pedido
              </h5>
              <ul className="space-y-1">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.quantity}x {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleOrderReady(order)}
              className="btn-success w-full flex items-center justify-center gap-2"
              disabled={processingId === order.id}
            >
              {processingId === order.id ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Pedido Pronto
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
