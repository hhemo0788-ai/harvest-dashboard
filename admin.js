/**
 * Admin logic for Harvest Company
 */

const productTable = document.getElementById('adminProductTable');
const productForm = document.getElementById('productForm');
const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');

let allProducts = [];

// Initial render
fetchAndRender();

async function fetchAndRender() {
    allProducts = await getProducts();
    applyFilter();
}

function applyFilter() {
    const term = document.getElementById('adminSearchInput')?.value.toLowerCase() || "";
    const filtered = allProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.ingredient && p.ingredient.toLowerCase().includes(term))
    );
    renderAdminTable(filtered);
}

const adminSearchInput = document.getElementById('adminSearchInput');
if (adminSearchInput) {
    adminSearchInput.addEventListener('input', applyFilter);
}

/**
 * Renders products in the admin table
 */
function renderAdminTable(productsToRender) {
    productTable.innerHTML = productsToRender.map(product => `
        <tr>
            <td style="font-weight: 600;">${product.name} ${product.isPopular ? '⭐' : ''}</td>
            <td>${product.price} ج.م</td>
            <td>${product.quantity}</td>
            <td><span class="badge badge-expiry">${product.expiry}</span></td>
            <td>
                <button class="btn btn-edit" onclick="editProduct('${product._id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">تعديل</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product._id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">حذف</button>
            </td>
        </tr>
    `).join('');
}

const ingredientContainer = document.getElementById('ingredientContainer');

/**
 * Adds a new ingredient input field
 */
window.addIngredientField = function (value = "") {
    const div = document.createElement('div');
    div.className = 'ingredient-input-wrapper';
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.style.marginBottom = '0.5rem';

    div.innerHTML = `
        <input type="text" class="ingredient-input" value="${value}" placeholder="ادخل المادة / التركيب" style="flex: 1;">
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()" style="padding: 0 0.8rem;">×</button>
    `;
    ingredientContainer.appendChild(div);
};

/**
 * Gets all ingredient values as a comma-separated string
 */
function getIngredients() {
    const inputs = document.querySelectorAll('.ingredient-input');
    return Array.from(inputs).map(input => input.value).filter(v => v.trim() !== "").join(', ');
}

/**
 * Sets ingredient fields based on string or array
 */
function setIngredients(ingredientStr) {
    ingredientContainer.innerHTML = ''; // Clear existing
    if (!ingredientStr) {
        addIngredientField(); // Add one empty by default
        return;
    }
    const ingredients = ingredientStr.split(', ');
    ingredients.forEach(ing => addIngredientField(ing));
}

window.updateImagePreview = function (url) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    if (url && url.trim() !== "") {
        previewImg.src = url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
};

/**
 * Opens modal for adding or editing
 * @param {Object} product Optional product for editing
 */
window.openModal = function (product = null) {
    productModal.style.display = 'flex';
    document.getElementById('imagePreview').style.display = 'none';
    if (product) {
        modalTitle.textContent = 'تعديل المنتج';
        document.getElementById('productId').value = product._id;
        document.getElementById('name').value = product.name;
        document.getElementById('category').value = product.category || "";

        setIngredients(product.ingredient);

        document.getElementById('cartonContent').value = product.cartonContent || "";
        document.getElementById('packageSize').value = product.packageSize || "";
        document.getElementById('useRate').value = product.useRate || "";
        document.getElementById('importer').value = product.importer || "";
        document.getElementById('origin').value = product.origin || "";
        document.getElementById('price').value = product.price || "";
        document.getElementById('quantity').value = product.quantity;
        document.getElementById('expiry').value = product.expiry;
        document.getElementById('isPopular').checked = product.isPopular || false;
        document.getElementById('productImage').value = product.image || "";

        if (product.image) {
            updateImagePreview(product.image);
        }
        toggleFields();
    } else {
        modalTitle.textContent = 'إضافة منتج جديد';
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        setIngredients(""); // One empty field
        toggleFields();
    }
};

window.toggleFields = function () {
    const category = document.getElementById('category').value;
    const group = document.getElementById('ingredientGroup');
    const label = document.getElementById('ingredientLabel');
    const pesticides = ['مبيد حشرى', 'مبيد فطري', 'مبيد اكاروسى', 'مبيد حشائش'];
    const fertilizers = ['npk', 'أسمدة متخصصة', 'منظم نمو', 'محسنات تربة'];

    if (pesticides.includes(category)) {
        group.style.display = 'block';
        label.textContent = 'المادة الفعالة';
    } else if (fertilizers.includes(category)) {
        group.style.display = 'block';
        label.textContent = 'التركيب';
    } else {
        group.style.display = 'none';
    }
};

window.closeModal = function () {
    productModal.style.display = 'none';
};

/**
 * Handle form submission
 */
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        ingredient: getIngredients(),
        cartonContent: document.getElementById('cartonContent').value,
        packageSize: document.getElementById('packageSize').value,
        price: document.getElementById('price').value,
        useRate: document.getElementById('useRate').value,
        importer: document.getElementById('importer').value,
        origin: document.getElementById('origin').value,
        quantity: document.getElementById('quantity').value,
        expiry: document.getElementById('expiry').value,
        isPopular: document.getElementById('isPopular').checked,
        image: document.getElementById('productImage').value
    };

    try {
        let res;
        if (id) {
            // Edit existing
            res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Add new
            res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        if (res.ok) {
            fetchAndRender();
            closeModal();
        } else {
            alert('حدث خطأ أثناء حفظ المنتج');
        }
    } catch (err) {
        console.error('Error saving product:', err);
    }
});

/**
 * Delete a product
 */
window.deleteProduct = async function (id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchAndRender();
            } else {
                alert('حدث خطأ أثناء حذف المنتج');
            }
        } catch (err) {
            console.error('Error deleting product:', err);
        }
    }
};

/**
 * Edit a product
 */
window.editProduct = async function (id) {
    try {
        const res = await fetch(`${API_URL}/products/${id}`);
        const product = await res.json();
        if (product) {
            openModal(product);
        }
    } catch (err) {
        console.error('Error fetching product for edit:', err);
    }
};

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
});
