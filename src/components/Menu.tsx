import { menuItems } from "../data/menu";

export function Menu() {
  // Função auxiliar para formatar dinheiro (BRL)
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-4xl font-bold text-center mb-8 text-yellow-500 font-serif">
        CARDÁPIO
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-yellow-500 transition-colors duration-300 group"
          >
            {/* Área da Imagem (Placeholder por enquanto) */}
            <div className="h-48 bg-zinc-800 flex items-center justify-center relative overflow-hidden">
              <span className="text-zinc-600 text-sm">Foto do {item.name}</span>
              {/* Quando tiver as imagens, descomente a linha abaixo: */}
              {/* <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> */}
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">{item.name}</h3>
                <span className="bg-yellow-500 text-black font-bold px-2 py-1 rounded text-sm">
                  {formatMoney(item.price)}
                </span>
              </div>
              
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.description}
              </p>

              <button className="w-full mt-4 bg-zinc-800 hover:bg-yellow-500 hover:text-black text-white py-2 rounded font-medium transition-colors text-sm uppercase tracking-wide">
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
