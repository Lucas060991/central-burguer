import { toast } from 'sonner';

// ⚠️ SUBSTITUA PELA SUA URL DO APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbz8w08V-c645VUFrl8tIq0iPSDo41H4McE7p9qoIqw_ZradmKPEnUlKVc0CbF0rwNaaAg/exec";

// --- TIPAGENS ---
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
}

export interface Customer {
  name: string;
  phone: string;
  address?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface LogEntry {
  orderNumber: number;
  dateTime: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  isDelivery: boolean;
  status?: string;
}

// --- INTEGRAÇÃO COM GOOGLE SHEETS ---

/**
 * Busca todos os produtos da planilha
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}?action=getProducts`);
    const data = await response.json();
    return data.map((p: any) => ({
      ...p,
      price: Number(p.price), // Garante numérico
      id: String(p.id)
    }));
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    toast.error("Erro ao carregar cardápio. Verifique sua conexão.");
    return [];
  }
}

/**
 * Busca histórico de pedidos (Logs)
 */
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const response = await fetch(`${API_URL}?action=getOrders`);
    const data = await response.json();
    // Inverte para o pedido mais recente aparecer primeiro
    return data.reverse(); 
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    return [];
  }
}

/**
 * Salva novo pedido e atualiza base de clientes automaticamente
 */
export async function saveOrder(orderData: LogEntry): Promise<boolean> {
  try {
    // O fetch usa 'no-cors' por padrão em alguns navegadores com Apps Script, 
    // mas para enviar dados (POST) precisamos enviar o body stringificado.
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveOrder',
        ...orderData
      })
    });
    
    // Como o Apps Script pode não retornar 200 OK padrão no modo simples,
    // assumimos sucesso se não cair no catch.
    return true;
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    toast.error("Falha ao salvar o registro do pedido.");
    return false;
  }
}

/**
 * (Opcional) Busca lista de clientes para autocomplete
 */
export async function getCustomers(): Promise<Customer[]> {
  try {
    const response = await fetch(`${API_URL}?action=getCustomers`);
    return await response.json();
  } catch (error) {
    return [];
  }
}

// --- FUNÇÕES DE CARRINHO (LOCAL) ---
// Mantém a lógica local para o carrinho enquanto o usuário navega
let cartListeners: (() => void)[] = [];

export const addToCart = (product: Product) => {
  const currentCart = getCart();
  const existingItem = currentCart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    currentCart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(currentCart));
  notifyListeners();
};

export const removeFromCart = (productId: string) => {
  const currentCart = getCart();
  const newCart = currentCart.filter((item) => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(newCart));
  notifyListeners();
};

export const updateQuantity = (productId: string, delta: number) => {
  const currentCart = getCart();
  const item = currentCart.find((i) => i.id === productId);
  
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }
  }
  
  localStorage.setItem('cart', JSON.stringify(currentCart));
  notifyListeners();
};

export const clearCart = () => {
  localStorage.removeItem('cart');
  notifyListeners();
};

export const getCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
};

export const subscribeToCart = (listener: () => void) => {
  cartListeners.push(listener);
  return () => {
    cartListeners = cartListeners.filter((l) => l !== listener);
  };
};

const notifyListeners = () => cartListeners.forEach((l) => l());
