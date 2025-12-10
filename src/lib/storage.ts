// src/lib/storage.ts

// --- DEFINIÇÕES DE TIPOS (Locais para evitar erros de importação) ---
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
  status: 'kitchen' | 'payment' | 'completed';
  timestamp: number;
  isDelivery: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
}

// --- FUNÇÕES DO CARRINHO ---

export const getCart = (): CartItem[] => {
  try {
    const cart = localStorage.getItem('hamb_central_cart');
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    return [];
  }
};

export const addToCart = (product: Product) => {
  const cart = getCart();
  
  // Converte IDs para String para evitar duplicidade (100 vs "100")
  const existingItemIndex = cart.findIndex(item => String(item.id) === String(product.id));

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem('hamb_central_cart', JSON.stringify(cart));
};

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  const cart = getCart();
  
  if (quantity < 1) {
    const newCart = cart.filter(item => String(item.id) !== String(productId));
    localStorage.setItem('hamb_central_cart', JSON.stringify(newCart));
    return;
  }

  const newCart = cart.map(item => 
    String(item.id) === String(productId) ? { ...item, quantity } : item
  );
  
  localStorage.setItem('hamb_central_cart', JSON.stringify(newCart));
};

export const clearCart = () => {
  localStorage.removeItem('hamb_central_cart');
};

// --- FUNÇÕES DE PEDIDO (ORDERS) ---

export const createOrder = (customer: Customer, items: CartItem[], isDelivery: boolean): Order => {
  const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
  
  const newOrder: Order = {
    id: crypto.randomUUID(),
    orderNumber,
    items,
    customer,
    total: items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (isDelivery ? 5 : 0),
    status: 'kitchen',
    timestamp: Date.now(),
    isDelivery
  };

  // Salva no LocalStorage para a tela da cozinha funcionar localmente
  const existingOrders = getOrdersByStatus('kitchen');
  localStorage.setItem('hamb_central_orders_kitchen', JSON.stringify([...existingOrders, newOrder]));
  
  addLog(`Pedido #${orderNumber} criado`, `Cliente: ${customer.name}`);

  return newOrder;
};

export const getOrdersByStatus = (status: string): Order[] => {
  try {
    const stored = localStorage.getItem(`hamb_central_orders_${status}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

// --- LOGS ---

export const addLog = (action: string, details: string) => {
  const logs = getLogs();
  const newLog: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action,
    details,
  };
  localStorage.setItem('hamb_central_logs', JSON.stringify([newLog, ...logs].slice(0, 50)));
};

export const getLogs = (): LogEntry[] => {
  try {
    const logs = localStorage.getItem('hamb_central_logs');
    return logs ? JSON.parse(logs) : [];
  } catch (e) {
    return [];
  }
};

// --- FUNÇÕES DE COMPATIBILIDADE (EVITA O CRASH) ---
// Se algum arquivo antigo tentar chamar essas funções, elas existem (vazias) e o site não quebra.

export const getProducts = (): Product[] => {
  return []; // Agora os produtos vêm da API, mas mantemos isso para não dar erro de "missing export"
};

export const addProduct = (p: any) => { console.log("Use api.addProduct"); };
export const updateProduct = (id: any, p: any) => {};
export const deleteProduct = (id: any) => {};
