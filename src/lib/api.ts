// src/lib/api.ts
import { Product, LogEntry, Order } from './storage';

// SUBSTITUA PELA URL QUE VOCÊ COPIOU NO PASSO 2
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlvpHs41uI-Nfu0YV36Gbbgk1wCQ0SMb8NpYpoDqIdpAi40nBmm6R7lT88R-iUwxYK2A/exec";

export const api = {
  // --- Produtos ---
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getProducts`);
      const json = await response.json();
      return json.data.map((p: any) => ({
        ...p,
        price: Number(p.price) // Garantir que preço seja número
      }));
    } catch (error) {
      console.error("Erro ao buscar produtos", error);
      return [];
    }
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    const id = Date.now().toString();
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addProduct", id, ...product }),
    });
    return { ...product, id };
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateProduct", id, ...updates }),
    });
  },

  deleteProduct: async (id: string) => {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteProduct", id }),
    });
  },

  // --- Logs ---
  getLogs: async (): Promise<LogEntry[]> => {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getLogs`);
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("Erro ao buscar logs", error);
      return [];
    }
  },

  addLog: async (order: Order) => {
    const logData = {
      orderNumber: order.orderNumber,
      dateTime: new Date().toLocaleString('pt-BR'),
      customerName: order.customer.name,
      paymentMethod: order.paymentMethod || 'N/A',
      total: order.total,
      // Detalhes complexos vão como string JSON
      details: JSON.stringify({
        customer: order.customer,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        isDelivery: order.isDelivery,
      })
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addLog", ...logData }),
    });
  },

  clearLogs: async () => {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "clearLogs" }),
    });
  }
};
