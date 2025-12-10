import { useState } from 'react';
import { Plus, Pencil, Trash2, Settings, Lock, Loader2 } from 'lucide-react'; // Adicionei Loader2
import { Product, updateProduct, deleteProduct, addToCart } from '@/lib/storage'; // Removi addProduct local
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { api } from '@/services/api'; // <--- IMPORTANTE: Importando a API

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
  
  // Novo estado para controlar o loading do envio
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Lanches' // Adicionei categoria (obrigatório para a planilha)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Bloqueia botão

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      };

      if (editingProduct) {
        // OBS: A edição ainda é local. Para editar na planilha, precisaria atualizar o script.
        updateProduct(editingProduct.id, productData);
        toast.success('Produto atualizado localmente!');
      } else {
        // --- AQUI A MÁGICA ACONTECE ---
        // Envia para o Google Sheets
        const sucesso = await api.addProduct(productData);
        
        if (sucesso) {
            toast.success('Produto enviado para a Planilha!');
        } else {
            toast.error('Erro ao salvar na planilha.');
        }
      }

      resetForm();
      // Dá um tempo para o Google Sheets processar antes de recarregar
      setTimeout(() => {
        onProductsChange(); 
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false); // Libera botão
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      category: product.category || 'Lanches'
    });
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Remover "${product.name}"? (Isso removerá apenas visualmente por enquanto)`)) {
      deleteProduct(product.id);
      onProductsChange();
      toast.success('Produto removido!');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', image: '', category: 'Lanches' });
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
                  disabled={isSubmitting}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço (R$)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Adicionei campo de Categoria, útil para organizar na planilha */}
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="Lanches">Lanches</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Combos">Combos</option>
                <option value="Sobremesas">Sobremesas</option>
              </select>

              <input
                type="text"
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                required
                disabled={isSubmitting}
              />
              <input
                type="url"
                placeholder="URL da imagem (opcional)"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="input-field"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="btn-primary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingProduct ? 'Atualizar' : 'Adicionar'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
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
