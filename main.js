const API_URL = '/api';

/**
 * Gets products from API
 * @returns {Promise<Array>} Array of product objects
 */
async function getProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        return await res.json();
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

/**
 * Fetches and displays the last update date
 */
async function fetchLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (!el) return;

    try {
        const res = await fetch(`${API_URL}/last-updated`);
        const data = await res.json();
        if (data.lastUpdated) {
            const date = new Date(data.lastUpdated);
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            el.textContent = `آخر تحديث للقائمة: ${date.toLocaleDateString('ar-EG', options)}`;
        }
    } catch (err) {
        console.error('Error fetching last updated date:', err);
    }
}

/**
 * Renders products to the grid
 * @param {string} filter Filter string for search
 * @param {string} category Category filter
 */
async function renderProducts(filter = "", category = "") {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const products = await getProducts();
    let filtered = products.filter(p => {
        const searchTerm = filter.toLowerCase();
        const matchesName = p.name ? p.name.toLowerCase().includes(searchTerm) : false;
        const matchesIngredient = p.ingredient && p.ingredient.toLowerCase().includes(searchTerm);
        const matchesCategory = category === "" || p.category === category;

        return (matchesName || matchesIngredient) && matchesCategory;
    });

    // If no category selected and no search, show only popular products
    if (category === "" && filter === "") {
        const popular = filtered.filter(p => p.isPopular);
        if (popular.length > 0) filtered = popular;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <p style="font-size: 1.2rem; color: var(--text-light);">لا توجد منتجات تطابق بحثك</p>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(product => `
        <a href="product-details.html?id=${product._id}" class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/150?text=No+Image'}" class="product-card-img" alt="${product.name}">
            
            <div class="product-card-body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--secondary); font-weight: 600;">
                            ${product.category || 'عام'} 
                            ${product.isPopular ? '<span style="color: var(--accent); margin-right: 5px;">★ الأكثر رواجاً</span>' : ''}
                        </div>
                        <h3>${product.name}</h3>
                    </div>
                    <div class="price">${parseFloat(product.price || 0).toFixed(2)} ج.م</div>
                </div>

                ${product.ingredient ? `<div style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-dark);">
                    <strong>${['npk', 'أسمدة متخصصة', 'منظم نمو', 'محسنات تربة'].includes(product.category) ? 'التركيب' : 'المادة الفعالة'}:</strong> ${product.ingredient}
                </div>` : ''}

                <div style="display: flex; gap: 2rem; font-size: 0.85rem; color: var(--text-light); margin-top: auto;">
                    <span>📦 ${product.cartonContent || 'غير متوفر'}</span>
                    <span>📏 ${product.packageSize || 'غير متوفر'}</span>
                    <span class="badge badge-stock" style="margin-right: auto;">متوفر: ${product.quantity || 0}</span>
                </div>
            </div>
            
            <div style="color: var(--secondary); font-size: 1.5rem; padding-left: 0.5rem;">←</div>
        </a>
    `).join('');
}

// Initial render if on index.html
if (document.getElementById('productGrid')) {
    renderProducts();
    fetchLastUpdated();
}
