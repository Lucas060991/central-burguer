import { useState } from 'react';
import { Minus, Plus, Trash2, Truck, ShoppingBag } from 'lucide-react';
import { CartItem, Customer, updateCartItemQuantity, createOrder, clearCart } from '@/lib/storage';
import { toast } from 'sonner';

interface CartScreenProps {
  cart: CartItem[];
  onCartChange: () => void;
  onOrderCreated: () => void;
}

const DELIVERY_FEE = 5.00;

export function CartScreen({ cart, onCartChange, onOrderCreated }: CartScreenProps) {
  const [isDelivery, setIsDelivery] = useState(false);
  const [customer, setCustomer] = useState<Customer>({ name: '', address: '', phone: '' });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (isDelivery ? DELIVERY_FEE : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) return toast.error('Carrinho vazio!');
    if (!customer.name.trim()) return toast.error('Informe o nome');
    if (isDelivery && !customer.address.trim()) return toast.error('Informe o endereço');

    // 1. Cria pedido LOCALMENTE (Vai para a aba PAGAMENTO)
    const order = createOrder(customer, cart, isDelivery);
    
    // 2. Feedback e Limpeza
    toast.success(`Pedido #${order.orderNumber} criado! Vá para Pagamento.`);
    setCustomer({ name: '', address: '', phone: '' });
    setIsDelivery(false);
    clearCart();
    onOrderCreated();
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <ShoppingBag className="w-24 h-24 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-display text-muted-foreground">CARRINHO VAZIO</h2>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h2 className="text-3xl font-display text-foreground mb-6">CARRINHO</h2>
      
      {/* LISTA DE ITENS */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-sm text-primary">R$ {item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { updateCartItemQuantity(item.id, item.quantity - 1); onCartChange(); }} className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold">{item.quantity}</span>
              <button onClick={() => { updateCartItemQuantity(item.id, item.quantity + 1); onCartChange(); }} className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card p-6 rounded-xl border border-border space-y-4">
          <input type="text" placeholder="Nome *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="input-field" required />
          <input type="tel" placeholder="Telefone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="input-field" />
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} className="w-5 h-5 accent-primary" />
            <span>Entrega? (+R$ 5,00)</span>
          </label>

          {isDelivery && (
            <input type="text" placeholder="Endereço *" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="input-field" required />
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-4 text-lg">
          Ir para Pagamento (R$ {total.toFixed(2)})
        </button>
      </form>
    </div>
  );
}
