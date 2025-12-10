// src/lib/storage.ts

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  name: string;
  address: string;
  phone: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  customer: Customer;
  total: number;
  status: 'payment' | 'kitchen' | 'completed'; // <--- ORDEM CORRETA
  timestamp: number;
  isDelivery: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
}

// --- CARRINHO ---
export const getCart = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem('hamb_central_cart') || '[]'); } catch { return []; }
};

export const addToCart = (product: Product) => {
  const cart = getCart();
  const index = cart.findIndex(item => String(item.id) === String(product.id));
  if (index > -1) cart[index].quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  localStorage.setItem('hamb_central_cart', JSON.stringify(cart));
};

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  const cart = getCart();
  const newCart = quantity < 1 
    ? cart.filter(item => String(item.id) !== String(productId))
    : cart.map(item => String(item.id) === String(productId) ? { ...item, quantity } : item);
  localStorage.setItem('hamb_central_cart', JSON.stringify(newCart));
};

export const clearCart = () => localStorage.removeItem('hamb_central_cart');

// --- PEDIDOS (LÓGICA CORRIGIDA) ---

export const createOrder = (customer: Customer, items: CartItem[], isDelivery: boolean): Order => {
  const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
  
  const newOrder: Order = {
    id: crypto.randomUUID(),
    orderNumber,
    items,
    customer,
    total: items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (isDelivery ? 5 : 0),
    status: 'payment', // <--- AGORA NASCE NO PAGAMENTO
    timestamp: Date.now(),
    isDelivery
  };

  // Salva na lista de Pagamento
  const paymentOrders = getOrdersByStatus('payment');
  localStorage.setItem('hamb_central_orders_payment', JSON.stringify([...paymentOrders, newOrder]));
  
  return newOrder;
};

export const getOrdersByStatus = (status: string): Order[] => {
  try { return JSON.parse(localStorage.getItem(`hamb_central_orders_${status}`) || '[]'); } catch { return []; }
};

// Mover pedido de uma fase para outra
export const updateOrderStatus = (orderId: string, newStatus: 'kitchen' | 'completed') => {
  // 1. Busca o pedido em qualquer lugar que ele esteja (payment ou kitchen)
  const allOrders = [...getOrdersByStatus('payment'), ...getOrdersByStatus('kitchen')];
  const order = allOrders.find(o => o.id === orderId);

  if (!order) return;

  // 2. Remove das listas anteriores
  const payment = getOrdersByStatus('payment').filter(o => o.id !== orderId);
  const kitchen = getOrdersByStatus('kitchen').filter(o => o.id !== orderId);
  
  localStorage.setItem('hamb_central_orders_payment', JSON.stringify(payment));
  localStorage.setItem('hamb_central_orders_kitchen', JSON.stringify(kitchen));

  // 3. Adiciona na nova lista
  order.status = newStatus; // Atualiza o status no objeto

  if (newStatus === 'kitchen') {
    localStorage.setItem('hamb_central_orders_kitchen', JSON.stringify([...kitchen, order]));
  } else if (newStatus === 'completed') {
    // Se for completed, vai para o histórico local também (Logs)
    addLog('Pedido Finalizado', `Pedido #${order.orderNumber} entregue.`);
  }
};

// --- LOGS ---
export const getLogs = (): LogEntry[] => {
  try { return JSON.parse(localStorage.getItem('hamb_central_logs') || '[]'); } catch { return []; }
};

export const addLog = (action: string, details: string) => {
  const logs = getLogs();
  const newLog = { id: crypto.randomUUID(), timestamp: Date.now(), action, details };
  localStorage.setItem('hamb_central_logs', JSON.stringify([newLog, ...logs].slice(0, 50)));
};

// --- COMPATIBILIDADE ---
export const getProducts = () => [];
export const addProduct = () => {};
export const updateProduct = () => {};
export const deleteProduct = () => {};
