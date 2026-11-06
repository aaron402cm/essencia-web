const db = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

let products = [];
let promotions = [];
let currentSlideIndex = 0;
let cart = [];
let currentBrand = 'TODAS';

// Cargar datos iniciales
async function initStore() {
    await loadPromotions();
    await loadProducts();
}

// 1. Cargar Promociones y Renderizar Carrusel
async function loadPromotions() {
    const { data, error } = await db.from('promotions').select('*').eq('is_active', true);
    if (!error && data) {
        promotions = data;
        renderSlider();
    }
}

function renderSlider() {
    const slider = document.getElementById('promo-slider');
    if (!promotions.length) {
        slider.innerHTML = `<div class="min-w-full p-12 text-center text-gray-400">Pronto nuevas promociones de impacto.</div>`;
        return;
    }

    slider.innerHTML = promotions.map(p => `
        <div class="min-w-full grid grid-cols-1 md:grid-cols-2 items-center p-8 md:p-12 gap-6 bg-gradient-to-r from-gray-50 to-gray-100">
            <div class="text-left space-y-3">
                <span class="bg-black text-white text-xs px-3 py-1 rounded-full uppercase tracking-widest font-semibold">${p.title}</span>
                <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900">${p.subtitle}</h2>
                ${p.new_price ? `
                    <div class="flex items-baseline space-x-3 mt-2">
                        <span class="text-2xl font-bold text-red-600">S/ ${Number(p.new_price).toFixed(2)}</span>
                        ${p.old_price ? `<span class="text-gray-400 line-through text-lg">S/ ${Number(p.old_price).toFixed(2)}</span>` : ''}
                    </div>
                ` : ''}
                <div class="pt-4">
                    <a href="#products-grid" class="inline-block bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gold hover:text-black transition shadow">
                        ${p.link_text || 'VER MÁS'}
                    </a>
                </div>
            </div>
            <div class="flex justify-center">
                <img src="${p.image_url}" alt="${p.title}" class="max-h-72 object-contain rounded-2xl shadow-sm">
            </div>
        </div>
    `).join('');
}

function nextSlide() {
    if (!promotions.length) return;
    currentSlideIndex = (currentSlideIndex + 1) % promotions.length;
    updateSliderPosition();
}

function prevSlide() {
    if (!promotions.length) return;
    currentSlideIndex = (currentSlideIndex - 1 + promotions.length) % promotions.length;
    updateSliderPosition();
}

function updateSliderPosition() {
    const slider = document.getElementById('promo-slider');
    slider.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
}

// Auto-rotación del carrusel cada 5 segundos
setInterval(() => {
    if (promotions.length > 1) nextSlide();
}, 5000);

// 2. Cargar Productos
async function loadProducts() {
    const { data, error } = await db.from('products').select('*').eq('is_active', true);
    if (!error && data) {
        products = data;
        renderProducts(products);
    }
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if (!items.length) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">No hay productos en esta categoría.</p>';
        return;
    }

    grid.innerHTML = items.map(p => `
        <div class="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl transition group">
            <div>
                <div class="relative h-52 rounded-xl overflow-hidden mb-4 bg-gray-50">
                    <img src="${p.image_url}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    <span class="absolute top-2 right-2 bg-white/90 text-black text-xs font-bold px-2.5 py-1 rounded-full shadow">${p.brand}</span>
                </div>
                <h3 class="font-serif text-base font-bold text-gray-900 mb-1">${p.name}</h3>
                <p class="text-xs text-gray-500 mb-3 line-clamp-2">${p.description || ''}</p>
            </div>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span class="text-lg font-bold text-black">S/ ${Number(p.price).toFixed(2)}</span>
                <button onclick="addToCart('${p.id}')" class="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gold hover:text-black transition shadow">
                    Agregar +
                </button>
            </div>
        </div>
    `).join('');
}

function filterByBrand(brand) {
    currentBrand = brand;
    document.querySelectorAll('.brand-btn').forEach(btn => {
        if (btn.dataset.brand === brand) {
            btn.classList.add('bg-black', 'text-white');
            btn.classList.remove('bg-gray-100', 'text-gray-700');
        } else {
            btn.classList.remove('bg-black', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        }
    });

    if (brand === 'TODAS') {
        renderProducts(products);
    } else {
        renderProducts(products.filter(p => p.brand.toLowerCase() === brand.toLowerCase()));
    }
}

// Carrito y WhatsApp
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;

    const itemsContainer = document.getElementById('cart-items');
    if (!cart.length) {
        itemsContainer.innerHTML = '<p class="text-gray-500 text-sm text-center py-10">Tu carrito está vacío</p>';
        document.getElementById('cart-total').innerText = 'S/ 0.00';
        return;
    }

    let total = 0;
    itemsContainer.innerHTML = cart.map(item => {
        sub = item.price * item.quantity;
        total += sub;
        return `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                    <h4 class="text-sm font-semibold text-gray-900">${item.name}</h4>
                    <p class="text-xs text-gold-dark">S/ ${item.price} x ${item.quantity}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="changeQty('${item.id}', -1)" class="px-2 bg-gray-200 rounded text-black">-</button>
                    <span class="text-sm font-bold">${item.quantity}</span>
                    <button onclick="changeQty('${item.id}', 1)" class="px-2 bg-gray-200 rounded text-black">+</button>
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
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        updateCartUI();
    }
}

function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('translate-x-full');
}

function checkoutWhatsApp() {
    if (!cart.length) {
        alert('Agrega al menos un producto a tu pedido.');
        return;
    }

    const phone = '51913550024';
    let message = 'Hola *Essência Perfumería*, deseo realizar el siguiente pedido:\n\n';
    let total = 0;
    cart.forEach((item, index) => {
        const sub = item.price * item.quantity;
        total += sub;
        message += `${index + 1}. *${item.name}* (${item.brand}) - Cant: ${item.quantity} - S/ ${sub.toFixed(2)}\n`;
    });
    message += `\n*Total a pagar: S/ ${total.toFixed(2)}*\n\n¡Quedo a la espera de la confirmación!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

initStore();
