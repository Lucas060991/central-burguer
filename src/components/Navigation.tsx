import { ShoppingBag, ChefHat, CreditCard, FileText, UtensilsCrossed, Lock } from 'lucide-react';

type Tab = 'menu' | 'cart' | 'kitchen' | 'payment' | 'logs';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  cartCount: number;
  kitchenCount: number;
  paymentCount: number;
  isAuthenticated: boolean;
}

const tabs = [
  { id: 'menu' as Tab, label: 'Cardápio', icon: UtensilsCrossed, protected: false },
  { id: 'cart' as Tab, label: 'Carrinho', icon: ShoppingBag, protected: false },
  { id: 'kitchen' as Tab, label: 'Cozinha', icon: ChefHat, protected: true },
  { id: 'payment' as Tab, label: 'Pagamento', icon: CreditCard, protected: true },
  { id: 'logs' as Tab, label: 'Histórico', icon: FileText, protected: true },
];

export function Navigation({ activeTab, onTabChange, cartCount, kitchenCount, paymentCount, isAuthenticated }: NavigationProps) {
  const getBadge = (tabId: Tab) => {
    switch (tabId) {
      case 'cart': return cartCount > 0 ? cartCount : null;
      case 'kitchen': return kitchenCount > 0 ? kitchenCount : null;
      case 'payment': return paymentCount > 0 ? paymentCount : null;
      default: return null;
    }
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl md:text-3xl font-display text-primary tracking-wider">
            🍔 HAMBURGUERIA CENTRAL
          </h1>
          
          <div className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const badge = getBadge(tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`nav-tab relative flex items-center gap-2 ${
                    activeTab === tab.id ? 'nav-tab-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.protected && !isAuthenticated && <Lock className="w-3 h-3 text-muted-foreground" />}
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex md:hidden overflow-x-auto pb-2 gap-2 -mx-4 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const badge = getBadge(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`nav-tab relative flex items-center gap-1 whitespace-nowrap text-xs ${
                  activeTab === tab.id ? 'nav-tab-active' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.protected && !isAuthenticated && <Lock className="w-3 h-3 text-muted-foreground" />}
                {badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
