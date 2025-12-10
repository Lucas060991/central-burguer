// src/services/api.ts

// 🔴 SUBSTITUA PELA SUA URL DO APPS SCRIPT AQUI
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby2GVETeIl9Ol-Wh6kJzTkQk0Kxn3eayj-ram-RWgvSXbvge0MTij9wpPII1zkF18V3/exec";

// Interface compatível com o seu componente
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export interface OrderData {
  id_pedido: string;
  cliente: {
    nome: string;
    telefone: string;
    endereco_rua: string;
    endereco_numero: string;
    bairro: string;
  };
  tipo_entrega: string;
  forma_pagto: string;
  total: number;
  resumo_itens: string;
  obs: string;
}
export interface NewProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export const api = {
  // Busca produtos e converte os nomes das colunas
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      
      // Mapeia do Português (Planilha) para Inglês (Site)
      return data.map((item: any) => ({
        id: String(item.id),
        name: item.nome,
        description: item.descricao,
        price: Number(item.preco),
        category: item.categoria,
        image: item.imagem_url
      }));
    } catch (error) {
      console.error("Erro ao carregar cardápio:", error);
      return [];
    }
  },

  // Envia o pedido para a planilha
createOrder: async (order: OrderData) => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'create_order', // <--- Importante para o script saber
          ...order
        })
      });
      return true;
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      return false;
    }
  },

  addProduct: async (product: NewProductData) => {
    try {
      // Mapeia do Inglês (Site) para Português (Planilha)
      const payload = {
        action: 'create_product', // <--- O SEGREDO ESTÁ AQUI
        nome: product.name,
        descricao: product.description,
        preco: product.price,
        categoria: product.category,
        imagem_url: product.image
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      return false;
    }
  }
};

