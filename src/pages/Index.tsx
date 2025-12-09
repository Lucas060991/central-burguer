import { api } from '@/lib/api';
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
import {
  getProducts,
  getCart,
  getOrdersByStatus,
  getLogs,
  Product,
  CartItem,
  Order,
  LogEntry,
} from '@/lib/storage';

type Tab = 'menu' | 'cart' | 'kitchen' | 'payment' | 'logs';

const PROTECTED_TABS: Tab[] = ['kitchen', 'payment', 'logs'];

const Index = () => {
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refreshData = useCallback(async () => {
    setProducts(getProducts());
    setCart(getCart());
    setKitchenOrders(getOrdersByStatus('kitchen'));
    setPaymentOrders(getOrdersByStatus('payment'));
    setLogs(getLogs());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

   const sheetProducts = await api.getProducts();
    if (sheetProducts.length > 0) {
      setProducts(sheetProducts);
    } else {
      setProducts(getProducts()); 
    }
      
       const sheetLogs = await api.getLogs();
    setLogs(sheetLogs);

   setCart(getCart());
    setKitchenOrders(getOrdersByStatus('kitchen'));
    setPaymentOrders(getOrdersByStatus('payment'));
  }, []);

  const handleOrderCreated = () => {
    refreshData();
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
          <MenuScreen
            products={products}
            onProductsChange={refreshData}
            onAddToCart={refreshData}
          />
        )}

        {activeTab === 'cart' && (
          <CartScreen
            cart={cart}
            onCartChange={refreshData}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {activeTab === 'kitchen' && (
          <KitchenScreen
            orders={kitchenOrders}
            onOrdersChange={refreshData}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentScreen
            orders={paymentOrders}
            onOrdersChange={refreshData}
          />
        )}

        {activeTab === 'logs' && (
          <LogsScreen
            logs={logs}
            onLogsChange={refreshData}
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
