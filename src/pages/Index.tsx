import { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { MenuScreen } from '@/components/MenuScreen';
import { CartScreen } from '@/components/CartScreen';
import { KitchenScreen } from '@/components/KitchenScreen';
import { PaymentScreen } from '@/components/PaymentScreen';
import { LogsScreen } from '@/components/LogsScreen';
import { FloatingCart } from '@/components/FloatingCart';
import { LoginModal } from '@/components/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { api, Product } from '@/services/api'; // <--- IMPORTAMOS NOSSA API
import {
  // getProducts, <--- REMOVIDO (agora vem da API)
  getCart,
  getOrdersByStatus,
  getLogs,
  CartItem,
  Order,
  LogEntry,
  clearCart // <--- Certifique-se de ter essa função no storage ou faça manualmente
} from '@/lib/storage';

type Tab = 'menu' | 'cart' | 'kitchen' | 'payment' | 'logs';

const PROTECTED_TABS: Tab[] = ['kitchen', 'payment', 'logs'];

const Index = () => {
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  
  // Estado para os Produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true); // Loading state

  const [cart, setCart] = useState<CartItem[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Função para buscar dados LOCAIS (Carrinho, Cozinha, Logs)
  const refreshLocalData = useCallback(() => {
    setCart(getCart());
    setKitchenOrders(getOrdersByStatus('kitchen'));
    setPaymentOrders(getOrdersByStatus('payment'));
    setLogs(getLogs());
  }, []);

  // Função para buscar dados da NUVEM (Google Sheets)
  const fetchMenuFromGoogle = useCallback(async () => {
    setLoadingProducts(true);
    const cloudProducts = await api.getProducts();
    if (cloudProducts.length > 0) {
      setProducts(cloudProducts);
    }
    setLoadingProducts(false);
  }, []);

  // Effect inicial
  useEffect(() => {
    fetchMenuFromGoogle(); // Busca produtos na nuvem
    refreshLocalData();    // Busca o resto localmente
  }, [fetchMenuFromGoogle, refreshLocalData]);

  // Quando um pedido é criado no CartScreen
  const handleOrderCreated = async (orderData?: any) => {
    // 1. Atualiza dados locais
    refreshLocalData();
    
    // 2. Se houver dados do pedido, envia para o Google Sheets
    // Nota: Você precisará passar os dados do pedido do componente CartScreen para cá
    // Se o CartScreen já lidar com a lógica, você pode chamar a api.createOrder dentro dele.
    
    if (isAuthenticated) {
      setActiveTab('kitchen');
    } else {
      setPendingTab('kitchen');
      setShowLoginModal(true);
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (PROTECTED_TABS.includes(tab) && !isAuthenticated) {
      setPendingTab(tab);
      setShowLoginModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLoginSuccess = () => {
    login();
    setShowLoginModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={cartCount}
        kitchenCount={kitchenOrders.length}
        paymentCount={paymentOrders.length}
        isAuthenticated={isAuthenticated}
      />

      <LoginModal
        open={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingTab(null);
        }}
        onSuccess={handleLoginSuccess}
      />

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'menu' && (
          <>
            {loadingProducts ? (
              <div className="text-center py-10">
                <p className="text-xl">Carregando cardápio do Google Sheets...</p>
              </div>
            ) : (
              <MenuScreen
                products={products}
                onProductsChange={fetchMenuFromGoogle}
                onAddToCart={refreshLocalData}
              />
            )}
          </>
        )}

        {activeTab === 'cart' && (
          <CartScreen
            cart={cart}
            onCartChange={refreshLocalData}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {activeTab === 'kitchen' && (
          <KitchenScreen
            orders={kitchenOrders}
            onOrdersChange={refreshLocalData}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentScreen
            orders={paymentOrders}
            onOrdersChange={refreshLocalData}
          />
        )}

        {activeTab === 'logs' && (
          <LogsScreen
            logs={logs}
            onLogsChange={refreshLocalData}
          />
        )}
      </main>

      <FloatingCart
        count={cartCount}
        onClick={() => setActiveTab('cart')}
      />
    </div>
  );
};

export default Index;