import { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { MenuScreen } from '@/components/MenuScreen';
import { CartScreen } from '@/components/CartScreen';
import { KitchenScreen } from '@/components/KitchenScreen';
import { PaymentScreen } from '@/components/PaymentScreen';
import { LogsScreen } from '@/components/LogsScreen';
import { FloatingCart } from '@/components/FloatingCart';
import { LoginModal } from '@/components/LoginModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProducts,
  fetchOrders,
  getCart,
  getLogs,
  filterOrdersByStatus,
  Product,
  CartItem,
  Order,
  LogEntry,
} from '@/lib/api';

type Tab = 'menu' | 'cart' | 'kitchen' | 'payment' | 'logs';

const PROTECTED_TABS: Tab[] = ['kitchen', 'payment', 'logs'];

const Index = () => {
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const refreshProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const refreshLocalData = useCallback(() => {
    setCart(getCart());
    setLogs(getLogs());
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([refreshProducts(), refreshOrders()]);
    refreshLocalData();
  }, [refreshProducts, refreshOrders, refreshLocalData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOrderCreated = async () => {
    await refreshOrders();
    refreshLocalData();
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

  const kitchenOrders = filterOrdersByStatus(orders, 'kitchen');
  const paymentOrders = filterOrdersByStatus(orders, 'payment');
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
          isLoadingProducts ? (
            <LoadingSpinner message="Carregando cardápio..." />
          ) : (
            <MenuScreen
              products={products}
              onProductsChange={refreshProducts}
              onAddToCart={refreshLocalData}
            />
          )
        )}

        {activeTab === 'cart' && (
          <CartScreen
            cart={cart}
            onCartChange={refreshLocalData}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {activeTab === 'kitchen' && (
          isLoadingOrders ? (
            <LoadingSpinner message="Carregando pedidos..." />
          ) : (
            <KitchenScreen
              orders={kitchenOrders}
              onOrdersChange={refreshOrders}
            />
          )
        )}

        {activeTab === 'payment' && (
          isLoadingOrders ? (
            <LoadingSpinner message="Carregando pagamentos..." />
          ) : (
            <PaymentScreen
              orders={paymentOrders}
              onOrdersChange={refreshOrders}
            />
          )
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
