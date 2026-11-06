// CONFIGURACIÓN SEGURA DE SUPABASE (Credenciales públicas anónimas)
const SUPABASE_URL = 'TU_URL_DE_SUPABASE';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_DE_SUPABASE';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let products = [];
let cart = [];
let currentBrand = 'TODAS';

// Cargar productos al iniciar la página
async function loadProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('products-grid').innerHTML = '<p class="col-span-full text-center text-red-400">Hubo un error al cargar el catálogo.</p>';
        return;
    }

    products = data;
    renderProducts(products);
}

// Renderizar productos en la interfaz
function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if (items.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">No hay productos disponibles en esta marca por el momento.</p>';
        return;
    }

    grid.innerHTML = items.map(p => `
        <div class="bg-[#0b0f19] border border-gold/20 rounded-2xl p-4 flex flex-col justify-between hover:border-gold/60 transition shadow-lg group">
            <div>
                <div class="relative h-48 rounded-xl overflow-hidden mb-4 bg-surface">
                    <img src="${p.image_url}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    <span class="absolute top-2 right-2 bg-surface/90 border border-gold/40 text-gold text-xs px-2.5 py-1 rounded-full">${p.brand}</span>
                </div>
                <h3 class="font-serif text-lg text-gold-light mb-1">${p.name}</h3>
                <p class="text-xs text-gray-400 mb-3 line-clamp-2">${p.description || 'Producto original de catálogo.'}</p>
            </div>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-gold/10">
                <span class="text-lg font-bold text-white">S/ ${Number(p.price).toFixed(2)}</span>
                <button onclick="addToCart('${p.id}')" class="bg-gold text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gold-light transition shadow">
                    Agregar +
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrar por marca
function filterByBrand(brand) {
    currentBrand = brand;
    document.querySelectorAll('.brand-btn').forEach(btn => {
        if (btn.dataset.brand === brand) {
            btn.classList.remove('bg-surface', 'border', 'border-gold/30', 'text-gray-300');
            btn.classList.add('bg-gold', 'text-black');
        } else {
            btn.classList.add('bg-surface', 'border', 'border-gold/30', 'text-gray-300');
            btn.classList.remove('bg-gold', 'text-black');
        }
    });

    if (brand === 'TODAS') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
        renderProducts(filtered);
    }
}

// Funciones del Carrito
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;

    const itemsContainer = document.getElementById('cart-items');
    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="text-gray-400 text-sm text-center py-10">Tu carrito está vacío</p>';
        document.getElementById('cart-total').innerText = 'S/ 0.00';
        return;
    }

    let total = 0;
    itemsContainer.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="flex justify-between items-center bg-background p-3 rounded-xl border border-gold/10">
                <div>
                    <h4 class="text-sm font-semibold text-white">${item.name}</h4>
                    <p class="text-xs text-gold">S/ ${item.price} x ${item.quantity}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="changeQty('${item.id}', -1)" class="px-2 bg-surface rounded text-gray-300 hover:text-white">-</button>
                    <span class="text-sm">${item.quantity}</span>
                    <button onclick="changeQty('${item.id}', 1)" class="px-2 bg-surface rounded text-gray-300 hover:text-white">+</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('cart-total').innerText = `S/ ${total.toFixed(2)}`;
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
}

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.toggle('translate-x-full');
}

// Redirigir a WhatsApp con el pedido formateado
function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert('Agrega al menos un producto a tu pedido.');
        return;
    }

    const phone = '51913550024'; // Número del dueño de la tarjeta
    let message = 'Hola *Essência Perfumería*, deseo realizar el siguiente pedido de catálogo:\n\n';
    
    let total = 0;
    cart.forEach((item, index) => {
        const sub = item.price * item.quantity;
        total += sub;
        message += `${index + 1}. *${item.name}* (${item.brand}) - Cant: ${item.quantity} - S/ ${sub.toFixed(2)}\n`;
    });

    message += `\n*Total a pagar: S/ ${total.toFixed(2)}*\n\n¡Quedo a la espera de la confirmación y entrega en Ventanilla/Callao!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}

// Ejecutar carga inicial al abrir la web
loadProducts();
