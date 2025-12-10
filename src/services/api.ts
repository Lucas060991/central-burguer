// src/services/api.ts

// 🔴 ATENÇÃO: SE VOCÊ GEROU NOVA VERSÃO NO SCRIPT, O LINK PODE TER MUDADO
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzpObZeKRktK6XyqUEcPO_Yc-q4fmn3nwhXlRS21ZP1WB3-fWEWREHQAmf0hn9BFC0/exec"; 

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
  };
  tipo_entrega: string;
  forma_pagto: string; // <--- Importante
  total: number;
  resumo_itens: string;
  obs: string;
}

export const api = {
  // Função auxiliar para evitar repetição
  _send: async (body: any) => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(body)
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      return data.map((item: any) => ({
        id: String(item.id),
        name: item.nome,
        description: item.descricao,
        price: Number(item.preco),
        category: item.categoria,
        image: item.imagem_url
      }));
    } catch (error) {
      return [];
    }
  },

  addProduct: async (product: any) => {
    return api._send({
      action: 'create_product',
      nome: product.name,
      descricao: product.description,
      preco: product.price,
      category: product.category,
      imagem_url: product.image
    });
  },

  // NOVA FUNÇÃO: DELETAR
  deleteProduct: async (id: string) => {
    return api._send({
      action: 'delete_product',
      id: id
    });
  },

  createOrder: async (order: OrderData) => {
    return api._send({
      action: 'create_order',
      ...order
    });
  }
};
