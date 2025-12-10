import { useState } from 'react';
import { Plus, Pencil, Trash2, Settings, Lock, Loader2, Search, X } from 'lucide-react'; // <--- Adicionei Search e X
import { Product, addToCart } from '@/lib/storage';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { api } from '@/services/api';

interface MenuScreenProps {
  products: Product[];
  onProductsChange: () => void;
  onAddToCart: (product: Product) => void;
}

export function MenuScreen({ products, onProductsChange, onAddToCart }: MenuScreenProps) {
  const { isAuthenticated, login } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. NOVO ESTADO DA PESQUISA
  const [searchTerm, setSearchTerm] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Lanches'
  });

  // 2. LÓGICA DE FILTRO (Nome ou Descrição)
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
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

      const sucesso = await api.addProduct(productData);
      if (sucesso) {
        toast.success('Produto salvo!');
        setFormData({ name: '', description: '', price: '', image: '', category: 'Lanches' });
        setShowForm(false);
        setTimeout(onProductsChange, 1500); 
      } else {
        toast.error('Erro ao salvar.');
      }
    } catch (error) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Apagar "${product.name}"?`)) return;
    setDeletingId(product.id);
    try {
      const sucesso = await api.deleteProduct(product.id);
      if (sucesso) {
        toast.success('Produto apagado!');
        setTimeout(onProductsChange, 1500);
      } else {
        toast.error('Erro ao apagar.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display text-foreground">CARDÁPIO</h2>
        <button
          onClick={handleAdminClick}
          className={`btn-secondary flex items-center gap-2 ${showAdmin ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {isAuthenticated ? <Settings className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Admin
        </button>
      </div>

      {/* 3. BARRA DE PESQUISA (VISUAL) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, ingrediente ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ÁREA ADMIN (FORMULÁRIO) */}
      {showAdmin && (
        <div className="p-4 bg-card rounded-xl border border-border animate-slide-in">
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
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" disabled={isSubmitting}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. LISTA DE PRODUTOS (USANDO A LISTA FILTRADA) */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>Nenhum produto encontrado com "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <div key={product.id} className="product-card animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="relative h-48 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                
                {showAdmin && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="p-2 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors text-white"
                    >
                      {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
                  <button 
                    onClick={() => { addToCart(product); onAddToCart(product); toast.success("Adicionado!"); }} 
                    className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
