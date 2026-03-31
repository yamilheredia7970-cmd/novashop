import { products, categories } from './data.js';

// State
let cart = JSON.parse(localStorage.getItem('novashop_cart')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // Initial route
});

function initApp() {
  updateCartCount();
  renderCartItems();
  
  // Setup cart toggle
  document.getElementById('cart-btn').addEventListener('click', () => toggleCart(true));
  document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
  document.getElementById('cart-overlay').addEventListener('click', () => toggleCart(false));
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  const contentDiv = document.getElementById('app-content');

  if (hash.startsWith('#product-')) {
    const id = parseInt(hash.split('-')[1]);
    contentDiv.innerHTML = renderProductPage(id);
  } else if (hash.startsWith('#category-')) {
    const cat = hash.split('-')[1];
    contentDiv.innerHTML = renderCategoryPage(cat);
  } else {
    contentDiv.innerHTML = renderHomePage();
  }

  window.scrollTo(0, 0);
  // Re-initialize lucide icons for newly injected HTML
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Cart Logic ---

window.addToCart = (productId) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.product.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ product, quantity: 1 });
  }

  saveCart();
  updateCartCount();
  renderCartItems();
  toggleCart(true); // Open cart
};

window.updateQuantity = (productId, delta) => {
  const item = cart.find(item => item.product.id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.product.id !== productId);
    }
    saveCart();
    updateCartCount();
    renderCartItems();
  }
};

window.removeFromCart = (productId) => {
  cart = cart.filter(i => i.product.id !== productId);
  saveCart();
  updateCartCount();
  renderCartItems();
};

function saveCart() {
  localStorage.setItem('novashop_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countEl = document.getElementById('cart-count');
  countEl.textContent = count;
  if (count > 0) {
    countEl.classList.remove('hidden');
    countEl.classList.add('flex');
  } else {
    countEl.classList.add('hidden');
    countEl.classList.remove('flex');
  }
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-gray-500">
        <i data-lucide="shopping-cart" class="w-12 h-12 mb-4 opacity-50"></i>
        <p>Tu carrito está vacío</p>
        <button onclick="toggleCart(false)" class="mt-4 text-blue-600 hover:underline">Continuar comprando</button>
      </div>
    `;
    totalEl.textContent = '$0.00';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.product.price * item.quantity;
    return `
      <div class="flex gap-4 py-4 border-b border-gray-100">
        <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <img src="${item.product.image}" alt="${item.product.name}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <h4 class="text-sm font-medium text-gray-900 line-clamp-2">${item.product.name}</h4>
            <div class="text-sm font-bold text-gray-900 mt-1">$${item.product.price}</div>
          </div>
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center border border-gray-200 rounded-lg">
              <button onclick="updateQuantity(${item.product.id}, -1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
              <span class="px-2 text-sm font-medium">${item.quantity}</span>
              <button onclick="updateQuantity(${item.product.id}, 1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
            </div>
            <button onclick="removeFromCart(${item.product.id})" class="text-red-500 hover:text-red-700 p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = '$' + total.toFixed(2);
  if (window.lucide) window.lucide.createIcons();
}

window.toggleCart = (show) => {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  if (show) {
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    // Small timeout to allow display:block to apply before opacity transition
    setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  } else {
    sidebar.classList.add('translate-x-full');
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
  }
};

// --- Components ---

function ProductCard(product) {
  return `
    <div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      <a href="#product-${product.id}" class="relative aspect-square overflow-hidden bg-gray-100 block">
        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
        ${product.discount ? `<span class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-${product.discount}%</span>` : ''}
      </a>
      <div class="p-5 flex flex-col flex-grow">
        <div class="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">${categories.find(c => c.id === product.category)?.name || product.category}</div>
        <a href="#product-${product.id}" class="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">${product.name}</a>
        <div class="flex items-center mb-4">
          <div class="flex text-yellow-400 text-sm">
            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
          </div>
          <span class="text-xs text-gray-500 ml-2">(${product.reviews})</span>
        </div>
        <div class="mt-auto flex items-center justify-between">
          <div>
            ${product.oldPrice ? `<span class="text-sm text-gray-400 line-through mr-2">$${product.oldPrice}</span>` : ''}
            <span class="text-lg font-bold text-gray-900">$${product.price}</span>
          </div>
          <button onclick="addToCart(${product.id})" class="bg-gray-900 text-white p-2.5 rounded-full hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg" title="Agregar al carrito">
            <i data-lucide="shopping-cart" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- Pages ---

function renderHomePage() {
  const featuredProducts = products.slice(0, 8);
  const offerProducts = products.filter(p => p.discount).slice(0, 4);
  const spotlightProduct = products.find(p => p.id === 2); // MacBook Pro

  return `
    <!-- Hero -->
    <section class="relative bg-gray-900 text-white overflow-hidden">
      <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2000" class="w-full h-full object-cover opacity-40" alt="Hero Background">
        <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div class="max-w-xl">
          <span class="inline-block py-1 px-3 rounded-full bg-blue-600/20 text-blue-400 text-sm font-semibold mb-4 border border-blue-500/30">Nuevas Ofertas 2026</span>
          <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">Tecnología y estilo para tu día a día.</h1>
          <p class="text-lg text-gray-300 mb-8">Descubre nuestro catálogo con más de 10,000 productos. Envío gratis en pedidos superiores a $50.</p>
          <a href="#category-all" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-gray-900 bg-white hover:bg-gray-100 transition-colors shadow-lg">
            Explorar Catálogo <i data-lucide="arrow-right" class="ml-2 w-5 h-5"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-12 bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold tracking-tight mb-8">Explorar por Categoría</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          ${categories.map(cat => `
            <a href="#category-${cat.id}" class="group flex flex-col items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div class="w-20 h-20 rounded-full overflow-hidden mb-3 bg-gray-100 shadow-sm group-hover:shadow-md transition-all">
                <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
              </div>
              <span class="font-medium text-gray-900">${cat.name}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Offers Section -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <i data-lucide="flame" class="w-8 h-8 text-red-500"></i> Ofertas Flash
            </h2>
            <p class="text-gray-500 mt-2">Descuentos por tiempo limitado</p>
          </div>
          <a href="#category-all" class="text-blue-600 hover:text-blue-800 font-medium hidden sm:block">Ver todas las ofertas &rarr;</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${offerProducts.map(p => ProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Spotlight Product -->
    ${spotlightProduct ? `
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div class="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
            <span class="text-blue-400 font-semibold tracking-wider uppercase text-sm mb-2">Producto Destacado</span>
            <h2 class="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">${spotlightProduct.name}</h2>
            <p class="text-gray-400 text-lg mb-8">${spotlightProduct.description}</p>
            <div class="flex items-center gap-4">
              <button onclick="addToCart(${spotlightProduct.id})" class="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                Comprar ahora - $${spotlightProduct.price}
              </button>
              <a href="#product-${spotlightProduct.id}" class="text-white hover:text-gray-300 font-medium underline underline-offset-4">
                Ver detalles
              </a>
            </div>
          </div>
          <div class="w-full md:w-1/2 relative min-h-[300px] md:min-h-[500px]">
            <img src="${spotlightProduct.image}" alt="${spotlightProduct.name}" class="absolute inset-0 w-full h-full object-cover">
          </div>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Main Catalog -->
    <section class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Tendencias</h2>
        <a href="#category-all" class="text-blue-600 hover:text-blue-800 font-medium">Ver todo el catálogo &rarr;</a>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${featuredProducts.map(p => ProductCard(p)).join('')}
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-16 bg-gray-50 border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold tracking-tight text-center mb-12">Lo que dicen nuestros clientes</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div class="flex text-yellow-400 mb-4">★★★★★</div>
            <p class="text-gray-600 mb-6">"El envío fue rapidísimo y la calidad del producto superó mis expectativas. Definitivamente volveré a comprar en NovaShop."</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden"><img src="https://i.pravatar.cc/150?img=32" alt="User"></div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm">María García</h4>
                <span class="text-xs text-gray-500">Cliente Verificado</span>
              </div>
            </div>
          </div>
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div class="flex text-yellow-400 mb-4">★★★★★</div>
            <p class="text-gray-600 mb-6">"Encontré la laptop que buscaba a un precio increíble. El servicio de atención al cliente resolvió todas mis dudas al instante."</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden"><img src="https://i.pravatar.cc/150?img=11" alt="User"></div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm">Carlos Ruiz</h4>
                <span class="text-xs text-gray-500">Cliente Verificado</span>
              </div>
            </div>
          </div>
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div class="flex text-yellow-400 mb-4">★★★★☆</div>
            <p class="text-gray-600 mb-6">"Gran variedad de productos fitness. Las pesas ajustables son de excelente calidad. La interfaz de la tienda es muy fácil de usar."</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden"><img src="https://i.pravatar.cc/150?img=5" alt="User"></div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm">Ana Martínez</h4>
                <span class="text-xs text-gray-500">Cliente Verificado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="py-20 bg-blue-600 text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-4">Únete a nuestro Newsletter</h2>
        <p class="text-blue-100 mb-8 text-lg">Recibe ofertas exclusivas, novedades y un 10% de descuento en tu primera compra.</p>
        <form class="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto" onsubmit="event.preventDefault(); alert('¡Gracias por suscribirte!');">
          <input type="email" placeholder="Tu correo electrónico" required class="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50">
          <button type="submit" class="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">Suscribirse</button>
        </form>
      </div>
    </section>
  `;
}

function renderCategoryPage(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  const title = category ? category.name : 'Todos los Productos';
  const filteredProducts = categoryId === 'all' ? products : products.filter(p => p.category === categoryId);

  return `
    <div class="bg-gray-50 py-8 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <a href="#home" class="hover:text-gray-900">Inicio</a>
          <span>/</span>
          <span class="text-gray-900 font-medium">${title}</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900">${title}</h1>
        <p class="text-gray-600 mt-2">${filteredProducts.length} productos encontrados</p>
      </div>
    </div>

    <section class="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Sidebar Filters (Simulated) -->
        <aside class="w-full md:w-64 flex-shrink-0">
          <div class="sticky top-24 space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><i data-lucide="sliders-horizontal" class="w-5 h-5"></i> Filtros</h3>
              
              <div class="space-y-6">
                <!-- Categorías -->
                <div>
                  <h4 class="font-medium text-sm text-gray-900 mb-3 uppercase tracking-wider">Categorías</h4>
                  <div class="space-y-2">
                    <a href="#category-all" class="block text-sm ${categoryId === 'all' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}">Todas</a>
                    ${categories.map(cat => `
                      <a href="#category-${cat.id}" class="block text-sm ${categoryId === cat.id ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}">${cat.name}</a>
                    `).join('')}
                  </div>
                </div>

                <!-- Precio -->
                <div class="pt-6 border-t border-gray-100">
                  <h4 class="font-medium text-sm text-gray-900 mb-3 uppercase tracking-wider">Precio</h4>
                  <div class="space-y-2">
                    <label class="flex items-center cursor-pointer group"><input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Menos de $50</span></label>
                    <label class="flex items-center cursor-pointer group"><input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-900">$50 - $200</span></label>
                    <label class="flex items-center cursor-pointer group"><input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-900">$200 - $500</span></label>
                    <label class="flex items-center cursor-pointer group"><input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> <span class="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Más de $500</span></label>
                  </div>
                </div>

                <!-- Valoración -->
                <div class="pt-6 border-t border-gray-100">
                  <h4 class="font-medium text-sm text-gray-900 mb-3 uppercase tracking-wider">Valoración</h4>
                  <div class="space-y-2">
                    <label class="flex items-center cursor-pointer group">
                      <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> 
                      <span class="ml-2 flex text-yellow-400 text-sm">★★★★☆ <span class="text-gray-500 ml-1">& más</span></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Product Grid -->
        <div class="flex-1">
          <div class="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span class="text-sm text-gray-500">Mostrando ${filteredProducts.length} resultados</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">Ordenar por:</span>
              <select class="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-3 pr-8">
                <option>Relevancia</option>
                <option>Menor Precio</option>
                <option>Mayor Precio</option>
                <option>Mejor Valorados</option>
              </select>
            </div>
          </div>
          
          ${filteredProducts.length > 0 ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${filteredProducts.map(p => ProductCard(p)).join('')}
            </div>
          ` : `
            <div class="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <i data-lucide="search-x" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p class="text-gray-500">Intenta cambiar los filtros o buscar otra categoría.</p>
            </div>
          `}
        </div>
      </div>
    </section>
  `;
}

function renderProductPage(id) {
  const product = products.find(p => p.id === id);
  const categoryName = categories.find(c => c.id === product?.category)?.name || product?.category;

  if (!product) return `<div class="text-center py-20 text-xl font-bold">Producto no encontrado</div>`;

  // Find related products (same category, excluding current)
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return `
    <div class="bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Breadcrumbs -->
        <div class="mb-8 flex items-center gap-2 text-sm">
          <a href="#home" class="text-gray-500 hover:text-gray-900 flex items-center gap-1"><i data-lucide="home" class="w-4 h-4"></i> Inicio</a>
          <span class="text-gray-400">/</span>
          <a href="#category-${product.category}" class="text-gray-500 hover:text-gray-900 capitalize">${categoryName}</a>
          <span class="text-gray-400">/</span>
          <span class="text-gray-900 font-medium truncate">${product.name}</span>
        </div>

        <div class="flex flex-col lg:flex-row gap-12">
          <!-- Image Gallery -->
          <div class="w-full lg:w-1/2">
            <div class="bg-gray-50 rounded-3xl overflow-hidden aspect-square border border-gray-100 relative group">
              <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
              ${product.discount ? `<span class="absolute top-6 left-6 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">-${product.discount}% OFF</span>` : ''}
            </div>
            <!-- Thumbnails (Simulated) -->
            <div class="grid grid-cols-4 gap-4 mt-4">
              <div class="aspect-square rounded-xl bg-gray-100 border-2 border-blue-600 overflow-hidden cursor-pointer"><img src="${product.image}" class="w-full h-full object-cover"></div>
              <div class="aspect-square rounded-xl bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity"><img src="${product.image}" class="w-full h-full object-cover grayscale"></div>
              <div class="aspect-square rounded-xl bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity"><img src="${product.image}" class="w-full h-full object-cover grayscale"></div>
            </div>
          </div>

          <!-- Product Details -->
          <div class="w-full lg:w-1/2 flex flex-col">
            <div class="mb-2 text-sm font-bold text-blue-600 uppercase tracking-wider">${categoryName}</div>
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4 leading-tight">${product.name}</h1>
            
            <div class="flex items-center gap-4 mb-6">
              <div class="flex items-center text-yellow-400 text-sm">
                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                <span class="text-gray-900 font-medium ml-2">${product.rating}</span>
              </div>
              <span class="text-gray-300">|</span>
              <a href="#" class="text-sm text-blue-600 hover:underline">${product.reviews} opiniones</a>
              <span class="text-gray-300">|</span>
              <span class="text-sm text-green-600 font-medium flex items-center gap-1"><i data-lucide="check-circle-2" class="w-4 h-4"></i> En stock</span>
            </div>

            <div class="mb-8 flex items-end gap-3">
              <span class="text-5xl font-extrabold text-gray-900 tracking-tight">$${product.price}</span>
              ${product.oldPrice ? `<span class="text-2xl text-gray-400 line-through mb-1">$${product.oldPrice}</span>` : ''}
            </div>

            <p class="text-gray-600 mb-8 text-lg leading-relaxed">${product.description}</p>

            <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2"><i data-lucide="list" class="w-5 h-5"></i> Especificaciones</h3>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                ${product.specs.map(spec => `
                  <li class="flex items-start text-gray-700 text-sm">
                    <i data-lucide="check" class="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0"></i> 
                    <span>${spec}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Add to Cart Actions -->
            <div class="mt-auto pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button onclick="addToCart(${product.id})" class="flex-1 bg-gray-900 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 hover:shadow-blue-600/20 hover:-translate-y-0.5">
                <i data-lucide="shopping-cart" class="w-6 h-6"></i> Agregar al carrito
              </button>
              <button class="p-4 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center">
                <i data-lucide="heart" class="w-6 h-6"></i>
              </button>
            </div>
            
            <!-- Trust Badges -->
            <div class="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100">
              <div class="flex flex-col items-center text-center">
                <i data-lucide="truck" class="w-6 h-6 text-gray-400 mb-2"></i>
                <span class="text-xs text-gray-600 font-medium">Envío Gratis</span>
              </div>
              <div class="flex flex-col items-center text-center">
                <i data-lucide="shield-check" class="w-6 h-6 text-gray-400 mb-2"></i>
                <span class="text-xs text-gray-600 font-medium">Garantía 2 Años</span>
              </div>
              <div class="flex flex-col items-center text-center">
                <i data-lucide="rotate-ccw" class="w-6 h-6 text-gray-400 mb-2"></i>
                <span class="text-xs text-gray-600 font-medium">Devolución 30 días</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Products -->
    ${relatedProducts.length > 0 ? `
    <section class="py-16 bg-gray-50 border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 mb-8">También te podría interesar</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${relatedProducts.map(p => ProductCard(p)).join('')}
        </div>
      </div>
    </section>
    ` : ''}
  `;
}
