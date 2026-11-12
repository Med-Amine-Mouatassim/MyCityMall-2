import { db, auth } from '../mcm/firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================== ÉTAT GLOBAL ================== */
let cart = [];
let allProducts = [];
let currentUser = null;
let currentShopEmail = "";

/* ================== RÉFÉRENCES DOM ================== */
const productsList = document.getElementById('products-list');
const shopTitle = document.getElementById('shop-title');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartItemsDisplay = document.getElementById('cart-items-display');
const showFormBtn = document.getElementById('show-form-button');
const orderForm = document.getElementById('order-form');
const modal = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body');
const shopMenu = document.getElementById('shop-menu');
const shopInstagram = document.getElementById('shop-instagram');
const shopLocationLink = document.getElementById('shop-location-link');
const shopLocationText = document.getElementById('shop-location-text');
const shopDeliveryWrap = document.getElementById('shop-delivery');
const shopDeliveryPrice = document.getElementById('shop-delivery-price');
const shopDeliveryAreasWrap = document.getElementById('shop-delivery-areas');
const shopDeliveryPlaces = document.getElementById('shop-delivery-places');
const shopDeliveryNoteWrap = document.getElementById('shop-delivery-note');
const shopDeliveryNoteText = document.getElementById('shop-delivery-note-text');

/* ================== AUTH ================== */
onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
});

/* ================== EMAIL FORMPSREE MAGASIN ================== */
function normalizeInstagramLink(value) {
    if (!value) return "";
    let v = String(value).trim();
    if (!v) return "";
    if (v.startsWith("@")) v = v.slice(1);
    if (!/^https?:\/\//i.test(v)) {
        v = `https://instagram.com/${v}`;
    }
    return v;
}

async function loadShopEmail(shopId) {
    let shop = null;
    try {
        const shopIdRaw = String(shopId || "");
        const shopIdLower = shopIdRaw.toLowerCase().trim();
        const snap = await getDoc(doc(db, "magasins", shopIdRaw));
        if (snap.exists()) {
            shop = snap.data();
        } else {
            const q1 = query(collection(db, "magasins"), where("id_magasin", "==", shopIdRaw));
            const q2 = query(collection(db, "magasins"), where("id_magasin", "==", shopIdLower));
            const res1 = await getDocs(q1);
            res1.forEach((docSnap) => {
                if (!shop) shop = docSnap.data();
            });
            if (!shop) {
                const res2 = await getDocs(q2);
                res2.forEach((docSnap) => {
                    if (!shop) shop = docSnap.data();
                });
            }
        }
    } catch (e) {
        console.error("Erreur lecture magasin (Firestore):", e);
    }

    if (!shop || !shop.email) {
        console.error("Email Formspree introuvable pour ce magasin");
    } else {
        currentShopEmail = shop.email;
        orderForm.action = currentShopEmail;
    }

    if (shopTitle && shop && shop.nom) {
        shopTitle.innerText = `Collection ${shop.nom}`;
    }

    if (shopMenu && shopInstagram) {
        const insta = shop ? normalizeInstagramLink(shop.instagram) : "";
        if (insta) {
            shopInstagram.href = insta;
            shopInstagram.classList.remove('disabled');
        } else {
            shopInstagram.href = "#";
            shopInstagram.classList.add('disabled');
        }
    }

    if (shopLocationLink && shopLocationText) {
        const locationText = shop && shop.emplacement ? shop.emplacement : "Localisation";
        shopLocationText.textContent = locationText;
        if (shop && shop.emplacement) {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.emplacement)}`;
            shopLocationLink.href = mapsUrl;
            shopLocationLink.classList.remove('disabled');
        } else {
            shopLocationLink.href = "#";
            shopLocationLink.classList.add('disabled');
        }
    }

    if (shopDeliveryWrap && shopDeliveryPrice) {
        const rawPrice = shop && shop.livraison_prix !== undefined ? shop.livraison_prix : "";
        const hasPrice = rawPrice !== "" && rawPrice !== null && rawPrice !== undefined;
        if (hasPrice) {
            const priceText = typeof rawPrice === "number"
                ? `${rawPrice} DH`
                : (String(rawPrice).toUpperCase().includes("DH") ? String(rawPrice) : `${rawPrice} DH`);
            shopDeliveryPrice.textContent = `Livraison: ${priceText}`;
            shopDeliveryWrap.style.display = "inline-flex";
        } else {
            shopDeliveryWrap.style.display = "none";
        }
    }

    if (shopDeliveryAreasWrap && shopDeliveryPlaces) {
        const places = shop && shop.livraison_lieux ? String(shop.livraison_lieux).trim() : "";
        if (places) {
            shopDeliveryPlaces.textContent = `Zones: ${places}`;
            shopDeliveryAreasWrap.style.display = "inline-flex";
        } else {
            shopDeliveryAreasWrap.style.display = "none";
        }
    }

    if (shopDeliveryNoteWrap && shopDeliveryNoteText) {
        const note = shop && shop.livraison_note ? String(shop.livraison_note).trim() : "";
        if (note) {
            shopDeliveryNoteText.textContent = note;
            shopDeliveryNoteWrap.style.display = "inline-flex";
        } else {
            shopDeliveryNoteWrap.style.display = "none";
        }
    }
}

/* ================== INITIALISATION ================== */
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get('shop');

    if (!shopId) {
        console.error("Aucun magasin spécifié");
        return;
    }

    await loadShopEmail(shopId);

    window.ouvrirModale = ouvrirModale;
    shopTitle.innerText = `Collection ${shopId.toUpperCase()}`;

    try {
        const q = query(
            collection(db, "produits"),
            where("id_magasin", "==", shopId.toLowerCase().trim())
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            productsList.innerHTML = "<p>Aucun produit disponible.</p>";
            return;
        }

        productsList.innerHTML = "";
        allProducts = [];

        snapshot.forEach((docSnap) => {
            const produit = docSnap.data();
            const produitId = docSnap.id;

            allProducts.push({ id: produitId, ...produit });

            const card = document.createElement('div');
            const formatClass = (produit.image_format === 'tall') ? 'format-tall' : 'format-wide';
            const bestClass = produit.best_seller ? 'best-seller' : '';
            card.className = `product-card ${formatClass} ${bestClass}`.trim();
            const sizes = Array.isArray(produit.tailles) && produit.tailles.length ? produit.tailles : ["Unique"];
            const colors = Array.isArray(produit.couleurs) && produit.couleurs.length ? produit.couleurs : [];
            card.innerHTML = `
                <div class="product-image">
                    <img src="${produit.image || 'default.jpg'}">
                </div>
                <div class="product-info">
                    <h3>${produit.nom}</h3>
                    <p class="product-price">${produit.prix} DH</p>
                    ${sizes.length ? `
                    <div class="size-selector">
                        <label>Taille</label>
                        <select class="product-size-select" data-size-for="${produitId}">
                            ${sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
                        </select>
                    </div>` : ""}
                    ${colors.length ? `
                    <div class="size-selector">
                        <label>Couleur</label>
                        <select class="product-size-select" data-color-for="${produitId}">
                            ${colors.map(c => `<option value="${c}">${c}</option>`).join("")}
                        </select>
                    </div>` : ""}
                    <div class="card-buttons">
                        <button class="details-btn" onclick="ouvrirModale('${produitId}')">Détails</button>
                        <button class="add-to-cart-btn" data-id="${produitId}">Ajouter</button>
                    </div>
                </div>
            `;
            productsList.appendChild(card);
        });

        attachCartEvents();

    } catch (err) {
        console.error("Erreur Firestore :", err);
    }
});

/* ================== PANIER ================== */
function attachCartEvents() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = () => addToCart(btn.dataset.id);
    });
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        const sizeSelect = document.querySelector(`select[data-size-for="${productId}"]`);
        const colorSelect = document.querySelector(`select[data-color-for="${productId}"]`);
        const selectedSize = sizeSelect ? sizeSelect.value : "Unique";
        const selectedColor = colorSelect ? colorSelect.value : "";
        cart.push({ ...product, selectedSize, selectedColor });
        updateCartUI();
        alert("Merci pour votre commande");
        const cartSection = document.getElementById('cart-summary');
        if (cartSection) {
            cartSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
}

function updateCartUI() {
    cartCount.textContent = cart.length;

    const total = cart.reduce((sum, item) => sum + Number(item.prix), 0);
    cartSubtotal.textContent = total.toFixed(2) + " DH";

    showFormBtn.disabled = cart.length === 0;
    showFormBtn.onclick = () => {
        document.getElementById('checkout-form-container').style.display = 'block';
    };

    cartItemsDisplay.innerHTML = cart.length === 0
        ? `<p class="empty-cart-message">Votre panier est vide.</p>`
        : cart.map((item, i) => `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:6px 0;">
                <span>${item.nom}${item.selectedSize ? ` (${item.selectedSize}${item.selectedColor ? ", " + item.selectedColor : ""})` : ""}</span>
                <span>
                    ${item.prix} DH
                    <button onclick="removeFromCart(${i})" style="color:red; background:none; border:none;">✖</button>
                </span>
            </div>
        `).join('');
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
};

/* ================== MODALE ================== */
function ouvrirModale(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const sizes = Array.isArray(product.tailles) && product.tailles.length ? product.tailles : ["Unique"];
    const colors = Array.isArray(product.couleurs) && product.couleurs.length ? product.couleurs : [];

    modalBody.innerHTML = `
        <img src="${product.image}" style="width:100%; max-height:300px; object-fit:cover;">
        <div style="padding:20px;">
            <h2>${product.nom}</h2>
            <p style="color:#00bcd4; font-size:1.4rem;">${product.prix} DH</p>
            <p>${product.description || "Aucune description."}</p>
            ${sizes.length ? `
            <div class="size-selector">
                <label>Taille</label>
                <select class="product-size-select" id="modal-size">
                    ${sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
                </select>
            </div>` : ""}
            ${colors.length ? `
            <div class="size-selector">
                <label>Couleur</label>
                <select class="product-size-select" id="modal-color">
                    ${colors.map(c => `<option value="${c}">${c}</option>`).join("")}
                </select>
            </div>` : ""}
            <button class="checkout-button" id="modal-add">Ajouter au panier</button>
        </div>
    `;

    modal.style.display = "block";

    document.getElementById('modal-add').onclick = () => {
        const ms = document.getElementById('modal-size');
        const mc = document.getElementById('modal-color');
        const sizeVal = ms ? ms.value : "Unique";
        const colorVal = mc ? mc.value : "";
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            cart.push({ ...product, selectedSize: sizeVal, selectedColor: colorVal });
            updateCartUI();
        }
        modal.style.display = "none";
    };
}

document.querySelector('.close-modal').onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

/* ================== COMMANDE ================== */
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {

        // 🔹 Champs envoyés à Formspree
        document.getElementById('hidden-facture').value =
            cart.map(p => `• ${p.nom}${p.selectedSize ? ` (${p.selectedSize}${p.selectedColor ? ", " + p.selectedColor : ""})` : ""} - ${p.prix} DH`).join('\n');

        document.getElementById('hidden-total').value =
            cartSubtotal.textContent;

        if (!currentUser) return;

        const orderId = `cmd_${Date.now()}`;

        const commande = {
            userId: currentUser.uid,
            client: orderForm.nom.value,
            telephone: orderForm.telephone.value,
            adresse: orderForm.adresse.value,
            articles: cart,
            total: cartSubtotal.textContent,
            statut: "en attente",
            createdAt: new Date()
        };

        await setDoc(doc(db, "commandes", orderId), commande);

        await setDoc(
            doc(db, "utilisateurs", currentUser.uid),
            {
                derniere_commande: orderId,
                derniere_commande_date: new Date()
            },
            { merge: true }
        );
    });
}



function ensureBackgroundContainer() {
    let container = document.getElementById('catalogue-bg');
    if (!container) {
        container = document.createElement('div');
        container.id = 'catalogue-bg';
        container.className = 'catalogue-bg';
        document.body.prepend(container);
    }
    return container;
}

function clearBackgroundMedia() {
    const container = document.getElementById('catalogue-bg');
    if (container) container.remove();
    document.body.style.backgroundImage = "";
    document.body.style.backgroundColor = "var(--bg-dark)";
}

function setBackgroundMedia(src) {
    if (!src) {
        clearBackgroundMedia();
        return;
    }

    const isVideo = /\.(mp4|webm|ogg)(\?|#|$)/i.test(src);
    const container = ensureBackgroundContainer();
    container.innerHTML = "";

    if (isVideo) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.src = encodeURI(src);
        container.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = encodeURI(src);
        img.alt = "Fond du catalogue";
        container.appendChild(img);
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    container.appendChild(overlay);

    document.body.style.backgroundImage = "none";
}


// Fonction pour appliquer le style personnalisé
async function applyCustomStyle(shopId) {

    const styleSnap = await getDoc(
        doc(db, "styles_magasins", shopId.toLowerCase().trim())
    );

    if (!styleSnap.exists()) return;

    const data = styleSnap.data();

    const root = document.documentElement;

    // TITRES
if (data.titleFont || data.titleColor) {

    document.querySelectorAll(
        'h1, h2, h3, .product-card h3'
    ).forEach(el => {

        if (data.titleFont)
            el.style.fontFamily = data.titleFont;

        if (data.titleColor)
            el.style.color = data.titleColor;
    });
}


// TEXTE NORMAL
if (data.textFont || data.textColor) {

    document.querySelectorAll(
        'p, span, small, .product-price'
    ).forEach(el => {

        if (data.textFont)
            el.style.fontFamily = data.textFont;

        if (data.textColor)
            el.style.color = data.textColor;
    });
}

    // Image ou video de fond
    if (data.backgroundImage) {
        setBackgroundMedia(data.backgroundImage);

        // Le header reste propre
        document.querySelector('header').style.background = "#121212";
    } else {
        clearBackgroundMedia();
    }


    // Dark mode
    if (data.darkMode === true) {
        root.style.setProperty('--bg-dark', '#0a0a0a');
        root.style.setProperty('--text-main', '#ffffff');
    }

    if (data.darkMode === false) {
        root.style.setProperty('--bg-dark', '#ffffff');
        root.style.setProperty('--text-main', '#000000');
    }

    // 🎵 Musique
    if (data.musicUrl) {
        startYoutubeMusic(data.musicUrl);
    }
}


function startYoutubeMusic(url) {
    const videoId = url.split('embed/')[1]?.split('?')[0];
    if (!videoId) return;

    const iframe = document.createElement('iframe');
    iframe.style.display = "none";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
    iframe.allow = "autoplay";
    
    // Jouer au premier clic de l'utilisateur sur le catalogue
    document.body.addEventListener('click', () => {
        if (!document.getElementById('bg-audio')) {
            iframe.id = 'bg-audio';
            document.body.appendChild(iframe);
        }
    }, { once: true });
}

// Dans votre DOMContentLoaded existant, ajoutez l'appel :
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get('shop');

    if (shopId) {
        await applyCustomStyle(shopId); // <--- Application du style ici
        await loadShopEmail(shopId);
        // ... reste du code ...
    }
});
