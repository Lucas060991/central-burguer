// Google Sheets API integration
const API_URL = 'https://script.google.com/macros/s/AKfycbw7rK5b8xfhwEeRZ9tlY1T21eg1racIZGV4kTht4wiZbyDqNJ7r66BYhufkk9ei6PLMEw/exec';

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
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  isDelivery: boolean;
}

// Default products (fallback)
const defaultProducts: Product[] = [
  { id: '1', name: 'BIG-BASIC', description: 'Hambúrguer artesanal com ingredientes selecionados', price: 12.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
  { id: '2', name: 'BIG-CLASSIC', description: 'Hambúrguer clássico com queijo e molho especial', price: 15.00, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop' },
  { id: '3', name: 'BIG-BURGUER', description: 'Hambúrguer especial da casa', price: 17.00, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop' },
  { id: '4', name: 'BIG-SALADA', description: 'Hambúrguer com salada fresca e ingredientes leves', price: 20.00, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop' },
  { id: '5', name: 'BIG-DOUBLÉ', description: 'Hambúrguer duplo com muito sabor', price: 25.00, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop' },
  { id: '6', name: 'BIG-FOME', description: 'Para quem está com muita fome', price: 30.00, image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop' },
  { id: '7', name: 'BIG-BACON', description: 'Hambúrguer com bacon crocante', price: 33.00, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop' },
  { id: '8', name: 'BIG-MONSTER', description: 'O maior hambúrguer da casa', price: 35.00, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop' },
  { id: '9', name: 'BATATA P', description: 'Porção pequena de batatas fritas', price: 8.00, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
  { id: '10', name: 'BATATA M', description: 'Porção média de batatas fritas', price: 10.00, image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop' },
  { id: '11', name: 'BATATA G', description: 'Porção grande de batatas fritas', price: 12.00, image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=300&fit=crop' },
];

// Cart (local only - not synced with Google Sheets)
const CART_KEY = 'hamburgueria_cart';

export function getCart(): CartItem[] {
  try {
    const item = localStorage.getItem(CART_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
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

// API calls
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}?action=read&sheet=Produtos`);
    const data = await response.json();
    
    if (data && Array.isArray(data) && data.length > 0) {
      // Map the Google Sheets data to Product format
      return data.map((row: any, index: number) => ({
        id: row.id || String(index + 1),
        name: row.name || row.nome || '',
        description: row.description || row.descricao || '',
        price: parseFloat(row.price || row.preco || 0),
        image: row.image || row.imagem || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      }));
    }
    return defaultProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    return defaultProducts;
  }
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${API_URL}?action=read&sheet=Pedidos`);
    const data = await response.json();
    
    if (data && Array.isArray(data)) {
      return data.map((row: any) => {
        // Parse items from text format back to array
        let items: CartItem[] = [];
        try {
          if (row.items) {
            items = JSON.parse(row.items);
          } else if (row.itens) {
            items = JSON.parse(row.itens);
          }
        } catch {
          items = [];
        }
        
        // Parse customer data
        let customer: Customer = { name: '', address: '', phone: '' };
        try {
          if (row.customer) {
            customer = JSON.parse(row.customer);
          } else if (row.cliente) {
            customer = typeof row.cliente === 'string' 
              ? { name: row.cliente, address: '', phone: '' }
              : JSON.parse(row.cliente);
          }
        } catch {
          customer = { name: row.cliente || row.customer || '', address: '', phone: '' };
        }
        
        const subtotal = parseFloat(row.subtotal || 0);
        const deliveryFee = parseFloat(row.deliveryFee || row.taxa_entrega || 0);
        const total = parseFloat(row.total || 0);
        
        return {
          id: String(row.id),
          orderNumber: parseInt(row.orderNumber || row.numero_pedido || row.id),
          customer,
          items,
          subtotal,
          deliveryFee,
          total,
          isDelivery: row.isDelivery === true || row.isDelivery === 'true' || row.entrega === true || row.entrega === 'true',
          status: (row.status || 'kitchen').toLowerCase() as Order['status'],
          createdAt: row.createdAt || row.data || new Date().toISOString(),
          paymentMethod: row.paymentMethod || row.forma_pagamento,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function createOrder(customer: Customer, items: CartItem[], isDelivery: boolean): Promise<Order> {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = isDelivery ? 5.00 : 0;
  const total = subtotal + deliveryFee;
  const orderNumber = Date.now();
  const today = new Date().toLocaleDateString('pt-BR');
  
  // Format items as text for the spreadsheet
  const itemsText = items.map(item => `${item.quantity}x ${item.name}`).join(', ');
  
  const order: Order = {
    id: String(orderNumber),
    orderNumber,
    customer,
    items,
    subtotal,
    deliveryFee,
    total,
    isDelivery,
    status: 'kitchen',
    createdAt: new Date().toISOString(),
  };
  
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        sheet: 'Pedidos',
        row: [
          orderNumber,
          customer.name,
          itemsText,
          total.toFixed(2),
          'Pendente',
          today,
          JSON.stringify(customer),
          JSON.stringify(items),
          subtotal.toFixed(2),
          deliveryFee.toFixed(2),
          isDelivery ? 'Sim' : 'Não',
        ],
      }),
    });
    
    clearCart();
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  try {
    const statusMap = {
      kitchen: 'Pendente',
      payment: 'Pronto',
      completed: 'Finalizado',
    };
    
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        id: orderId,
        status: statusMap[status],
      }),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Logs (local storage - keeping for receipt history)
const LOGS_KEY = 'hamburgueria_logs';

export function getLogs(): LogEntry[] {
  try {
    const item = localStorage.getItem(LOGS_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function addLog(order: Order): void {
  const logs = getLogs();
  const logEntry: LogEntry = {
    orderNumber: order.orderNumber,
    dateTime: new Date().toLocaleString('pt-BR'),
    customerName: order.customer.name,
    paymentMethod: order.paymentMethod || 'N/A',
    total: order.total,
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    isDelivery: order.isDelivery,
  };
  logs.unshift(logEntry);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function clearLogs(): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify([]));
}

// Filter orders by status
export function filterOrdersByStatus(orders: Order[], status: Order['status']): Order[] {
  return orders.filter(o => o.status === status);
}
