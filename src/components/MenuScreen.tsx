import { useState } from 'react';
import { Plus, Pencil, Trash2, Settings, Lock } from 'lucide-react';
import { Product, addToCart } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/LoginModal';

interface MenuScreenProps {
  products: Product[];
  onProductsChange: () => void;
  onAddToCart: (product: Product) => void;
}

export function MenuScreen({ products, onProductsChange, onAddToCart }: MenuScreenProps) {
  const { isAuthenticated, login } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });

  const handleAdminClick = () => {
    if (showAdmin) {
      setShowAdmin(false);
      return;
    }
    
    if (isAuthenticated) {
      setShowAdmin(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    login();
    setShowLoginModal(false);
    setShowAdmin(true);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    onAddToCart(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Note: Product management via Google Sheets is not implemented yet
    // For now, products are read-only from the spreadsheet
    toast.info('Gerenciamento de produtos via planilha em desenvolvimento');
    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
    });
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    // Note: Product management via Google Sheets is not implemented yet
    toast.info('Gerenciamento de produtos via planilha em desenvolvimento');
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', image: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div className="animate-fade-in">
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-display text-foreground">CARDÁPIO</h2>
        <button
          onClick={handleAdminClick}
          className={`btn-secondary flex items-center gap-2 ${showAdmin ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {isAuthenticated ? <Settings className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Admin
        </button>
      </div>

      {showAdmin && (
        <div className="mb-6 p-4 bg-card rounded-xl border border-border animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Gerenciar Produtos</h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2 text-sm py-2"
              >
                <Plus className="w-4 h-4" />
                Novo Produto
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço (R$)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="url"
                placeholder="URL da imagem (opcional)"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="input-field"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Atualizar' : 'Adicionar'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="product-card animate-slide-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {showAdmin && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 bg-card/90 rounded-lg hover:bg-card transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-2 bg-card/90 rounded-lg hover:bg-card transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary">
                  R$ {product.price.toFixed(2)}
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
