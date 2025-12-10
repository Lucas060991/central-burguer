// Storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'hamburgueria_products',
  CART: 'hamburgueria_cart',
  ORDERS: 'hamburgueria_orders',
  LOGS: 'hamburgueria_logs',
  ORDER_COUNTER: 'hamburgueria_order_counter',
} as const;

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
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
  orderNumber: number;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  isDelivery: boolean;
  status: 'kitchen' | 'payment' | 'completed';
  createdAt: string;
  paymentMethod?: 'pix' | 'dinheiro' | 'cartao';
}

export interface LogEntry {
  orderNumber: number;
  dateTime: string;
  customerName: string;
  paymentMethod: string;
  total: number;
  // Full order data for reprinting
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  isDelivery: boolean;
}

// Default products
const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'BIG-BASIC',
    description: 'Hambúrguer artesanal com ingredientes selecionados',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'BIG-CLASSIC',
    description: 'Hambúrguer clássico com queijo e molho especial',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'BIG-BURGUER',
    description: 'Hambúrguer especial da casa',
    price: 17.00,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'BIG-SALADA',
    description: 'Hambúrguer com salada fresca e ingredientes leves',
    price: 20.00,
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'BIG-DOUBLÉ',
    description: 'Hambúrguer duplo com muito sabor',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'BIG-FOME',
    description: 'Para quem está com muita fome',
    price: 30.00,
    image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    name: 'BIG-BACON',
    description: 'Hambúrguer com bacon crocante',
    price: 33.00,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    name: 'BIG-MONSTER',
    description: 'O maior hambúrguer da casa',
    price: 35.00,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
  },
  {
    id: '9',
    name: 'BATATA P',
    description: 'Porção pequena de batatas fritas',
    price: 8.00,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
  },
  {
    id: '10',
    name: 'BATATA M',
    description: 'Porção média de batatas fritas',
    price: 10.00,
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop',
  },
  {
    id: '11',
    name: 'BATATA G',
    description: 'Porção grande de batatas fritas',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=300&fit=crop',
  },
];

// Helper functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Products
export function getProducts(): Product[] {
  const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (products.length === 0) {
    setToStorage(STORAGE_KEYS.PRODUCTS, defaultProducts);
    return defaultProducts;
  }
  return products;
}

export function saveProducts(products: Product[]): void {
  setToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function addProduct(product: Omit<Product, 'id'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...updates };
    saveProducts(products);
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

// Cart
export function getCart(): CartItem[] {
  return getFromStorage<CartItem[]>(STORAGE_KEYS.CART, []);
}

export function saveCart(cart: CartItem[]): void {
  setToStorage(STORAGE_KEYS.CART, cart);
}

export function addToCart(product: Product): void {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === product.id);
  
  if (existingIndex !== -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  saveCart(cart);
}

export function updateCartItemQuantity(productId: string, quantity: number): void {
  const cart = getCart();
  if (quantity <= 0) {
    saveCart(cart.filter(item => item.id !== productId));
  } else {
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
      cart[index].quantity = quantity;
      saveCart(cart);
    }
  }
}

export function clearCart(): void {
  saveCart([]);
}

// Orders
export function getNextOrderNumber(): number {
  const counter = getFromStorage<number>(STORAGE_KEYS.ORDER_COUNTER, 1000);
  const nextNumber = counter + 1;
  setToStorage(STORAGE_KEYS.ORDER_COUNTER, nextNumber);
  return nextNumber;
}

export function getOrders(): Order[] {
  return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function saveOrders(orders: Order[]): void {
  setToStorage(STORAGE_KEYS.ORDERS, orders);
}

export function createOrder(customer: Customer, items: CartItem[], isDelivery: boolean, customDeliveryFee: number = 0): Order {
  const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const finalDeliveryFee = isDelivery ? customDeliveryFee : 0;
  
  const total = subtotal + finalDeliveryFee;

  const newOrder: Order = {
    id: crypto.randomUUID(),
    orderNumber,
    items: [...items],
    customer,
    isDelivery,
    deliveryFee: finalDeliveryFee, // <--- SALVE O VALOR CORRETO AQUI
    subtotal,
    total,
    status: 'pending',
    createdAt: Date.now(),
  };

  const orders = getOrders();
  orders.push(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  return newOrder;
}

export function updateOrderStatus(orderId: string, status: Order['status'], paymentMethod?: Order['paymentMethod']): void {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    if (paymentMethod) {
      orders[index].paymentMethod = paymentMethod;
    }
    saveOrders(orders);
  }
}

export function getOrdersByStatus(status: Order['status']): Order[] {
  return getOrders().filter(o => o.status === status);
}

// Logs
export function getLogs(): LogEntry[] {
  return getFromStorage<LogEntry[]>(STORAGE_KEYS.LOGS, []);
}

export function addLog(order: Order): void {
  const logs = getLogs();
  const logEntry: LogEntry = {
    orderNumber: order.orderNumber,
    dateTime: new Date().toLocaleString('pt-BR'),
    customerName: order.customer.name,
    paymentMethod: order.paymentMethod || 'N/A',
    total: order.total,
    // Full order data for reprinting
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    isDelivery: order.isDelivery,
  };
  logs.unshift(logEntry);
  setToStorage(STORAGE_KEYS.LOGS, logs);
}

export function clearLogs(): void {
  setToStorage(STORAGE_KEYS.LOGS, []);
}
