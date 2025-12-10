import { useState } from 'react';
import { Plus, Pencil, Trash2, Settings, Lock, Loader2 } from 'lucide-react';
import { Product, addToCart } from '@/lib/storage';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { api } from '@/services/api'; // Importando a API

interface MenuScreenProps {
  products: Product[];
  onProductsChange: () => void;
  onAddToCart: (product: Product) => void;
}

export function MenuScreen({ products, onProductsChange, onAddToCart }: MenuScreenProps) {
  const { isAuthenticated, login } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading geral
  const [deletingId, setDeletingId] = useState<string | null>(null); // Loading específico do delete

  // Estados do Formulário
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Lanches'
  });

  const handleAdminClick = () => {
    isAuthenticated ? setShowAdmin(!showAdmin) : setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    login();
    setShowLoginModal(false);
    setShowAdmin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      };

      // Envia para o Google Sheets
      const sucesso = await api.addProduct(productData);
      
      if (sucesso) {
        toast.success('Produto salvo na planilha!');
        setFormData({ name: '', description: '', price: '', image: '', category: 'Lanches' }); // Limpa form
        setShowForm(false);
        // Aguarda um pouco e recarrega
        setTimeout(onProductsChange, 1500); 
      } else {
        toast.error('Erro ao conectar com a planilha.');
      }
    } catch (error) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNÇÃO DE DELETAR CONECTADA À PLANILHA ---
  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja apagar "${product.name}" da Planilha Google?`)) return;

    setDeletingId(product.id); // Ativa loading no ícone

    try {
      const sucesso = await api.deleteProduct(product.id);
      
      if (sucesso) {
        toast.success('Produto apagado da planilha!');
        setTimeout(onProductsChange, 1500); // Recarrega a lista
      } else {
        toast.error('Erro ao apagar. Verifique sua conexão.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
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
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                <Plus className="w-4 h-4" /> Novo Produto
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>
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
                placeholder="URL da Imagem"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="input-field"
                disabled={isSubmitting}
              />
              
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar na Planilha"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" disabled={isSubmitting}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div key={product.id} className="product-card animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="relative h-48 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              
              {showAdmin && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleDelete(product)}
                    disabled={deletingId === product.id}
                    className="p-2 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors text-white"
                    title="Apagar da Planilha"
                  >
                    {deletingId === product.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
                <button onClick={() => { addToCart(product); onAddToCart(product); toast.success("Adicionado!"); }} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
