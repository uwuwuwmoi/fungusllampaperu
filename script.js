// --- CONFIGURACIÓN ---
const phoneNumber = "51966756553";

// --- IMÁGENES GENÉRICAS DE INSUMOS ---
const INSUMO_IMAGES = {
  kit: [
    "img/kit-cultivo-1.webp",
    "img/kit-cultivo-2.webp",
    "img/kit-cultivo-3.webp",
  ],
  spawn: ["img/grain-spawn-1.webp", "img/grain-spawn-2.webp"],
  agar: ["img/placa-petri-1.webp", "img/placa-petri-2.webp"],
};

// --- PRECIOS Y TEXTOS (LÓGICA MANUAL) ---
// Estructura: { regular: PrecioNormal, preventa: PrecioOferta }
const PRICING = {
  clasica: {
    lc: { regular: 85, preventa: 75 }, // Termina en 5
    spawn: { regular: 110, preventa: 95 }, // Solicitado explícitamente
    kit: { regular: 130, preventa: 115 }, // Termina en 5
    agar: { regular: 99, preventa: 85 }, // Bajada atractiva
  },
  exotica: {
    lc: { regular: 160, preventa: 139 }, // Termina en 9
    spawn: { regular: 189, preventa: 165 }, // Termina en 5
    kit: { regular: 199, preventa: 179 }, // De 3 dígitos a oferta atractiva
    agar: { regular: 179, preventa: 155 }, // Termina en 5
  },
};

const FORMAT_DETAILS = {
  "Cultura Líquida (LC)": {
    key: "lc",
    text: "Jeringa estéril de 10ml con micelio vivo de esta genética específica. Ideal para inocular tus propios frascos.",
    imageType: "strain",
  },
  "Grano (Spawn)": {
    key: "spawn",
    text: "Mushbag de 1Kg de grano esterilizado 100% colonizado y libre de contaminación. Listo para mezclar con sustrato o transferencias.",
    imageType: "spawn",
  },
  "Kit de Cultivo": {
    key: "kit",
    text: "Sistema todo en uno colonizado. Incluye grano, sustrato y bolsa con filtro anti-contaminantes y guía constante. Sin pasos difíciles y automático. Ideal para empezar.",
    imageType: "kit",
  },
  "Placa Petri (Agar)": {
    key: "agar",
    text: "Placa de agar con micelio aislado de esta genética. Perfecta para usuarios más avanzados.",
    imageType: "agar",
  },
};

const TYPE_INFO = {
  clasica: {
    title: "¿Qué significa cepa clásica?",
    text: "Son genéticas antiguas, estabilizadas y de confianza mundial. Conocidas por su resistencia y resultados predecibles. Ideales para estudios estándar y principiantes.",
  },
  exotica: {
    title: "¿Qué significa cepa exótica?",
    text: "Genéticas importadas de reciente aislamiento o mutaciones raras. Se caracterizan por morfologías únicas y una mayor concentración etnobotánica. Selección exclusiva para coleccionistas.",
  },
};

// --- VARIABLES GLOBALES ---
let cart = JSON.parse(localStorage.getItem("magikCart")) || [];
let currentProduct = {};
let currentSlideIndex = 0;
let currentImages = [];

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
});

function saveCart() {
  localStorage.setItem("magikCart", JSON.stringify(cart));
}

// --- FUNCIONES DEL MODAL ---
function openModal(element) {
  const modal = document.getElementById("productModal");

  // Obtener datos del HTML
  currentProduct = {
    name: element.getAttribute("data-name"),
    type: element.getAttribute("data-type"), // 'clasica' o 'exotica'
    strainDesc: element.getAttribute("data-desc"),
    strainImg: element
      .getAttribute("data-img")
      .split(",")
      .map((img) => img.trim()),
  };

  document.getElementById("modal-title").innerText = currentProduct.name;
  setupVariantSelect();
  modal.style.display = "flex";
}

function setupVariantSelect() {
  const select = document.getElementById("variant-select");
  const options = Object.keys(FORMAT_DETAILS);

  select.innerHTML = "";
  options.forEach((opt) => {
    const optionElement = document.createElement("option");
    optionElement.value = opt;
    optionElement.innerText = opt;
    select.appendChild(optionElement);
  });

  select.onchange = () => updateModalDetails(select.value);
  updateModalDetails(select.value); // Cargar primera opción
}

function updateModalDetails(selectedOption) {
  const priceElement = document.getElementById("modal-price");
  const descElement = document.getElementById("modal-desc");

  const formatData = FORMAT_DETAILS[selectedOption];
  const type = currentProduct.type || "clasica";
  const typeData = TYPE_INFO[type];

  // 1. Obtener precios del objeto PRICING
  const prices = PRICING[type][formatData.key];
  const regularPrice = prices.regular;
  const preventaPrice = prices.preventa;

  currentProduct.currentPrice = regularPrice;
  currentProduct.currentVariety = selectedOption;

  // 2. Actualizar Precio Principal (Regular)
  priceElement.innerText = regularPrice.toFixed(2);

  // 3. Generar HTML del acordeón
  descElement.innerHTML = `
    <div class="product-info-block">
        <p class="main-desc">${formatData.text}</p>
    </div>

    <div class="accordion-wrapper">
        <button class="accordion-btn" onclick="toggleAccordion(this)">
            Precio por preventa <span class="arrow">▼</span>
        </button>
        <div class="panel">
            <div class="preventa-content">
                <p class="price-comparison">
                    <span class="strikethrough">${regularPrice.toFixed(
                      2
                    )}</span> 
                    <span class="highlight-price">${preventaPrice.toFixed(
                      2
                    )}</span>
                </p>
                <p class="small-text">Reserva tu producto ahora a un precio reducido. El producto estará disponible en la fecha estimada (7-14 días hábiles).</p>
            </div>
        </div>
    </div>

    <div class="accordion-wrapper">
        <button class="accordion-btn" onclick="toggleAccordion(this)">
            ${typeData.title} <span class="arrow">▼</span>
        </button>
        <div class="panel">
            <p class="small-text">${typeData.text}</p>
        </div>
    </div>
    
    <div class="variant-note">
        <p>Añade al carrito para consultar por WhatsApp</p>
    </div>
  `;

  // 4. Actualizar Imágenes
  if (formatData.imageType === "strain")
    currentImages = currentProduct.strainImg;
  else if (FORMAT_DETAILS[selectedOption])
    currentImages = INSUMO_IMAGES[formatData.imageType] || [];

  currentSlideIndex = 0;
  setupCarousel();
}

// --- LÓGICA ACORDEÓN ---
function toggleAccordion(btn) {
  btn.classList.toggle("active");
  const panel = btn.nextElementSibling;
  const arrow = btn.querySelector(".arrow");

  if (panel.style.maxHeight) {
    panel.style.maxHeight = null;
    arrow.style.transform = "rotate(0deg)";
  } else {
    panel.style.maxHeight = panel.scrollHeight + "px";
    arrow.style.transform = "rotate(180deg)";
  }
}

// --- LÓGICA DEL CARRUSEL ---
function setupCarousel() {
  const imgWrapper = document.querySelector(".modal-img-wrapper");
  imgWrapper.innerHTML = "";

  if (currentImages.length === 0 || currentImages.length === 1) {
    const src =
      currentImages.length === 1 ? currentImages[0] : "img/placeholder.webp";
    imgWrapper.innerHTML = `<img src="${src}" alt="${currentProduct.name}" class="modal-static-img">`;
  } else {
    let slidesHTML = "";
    currentImages.forEach((img, index) => {
      slidesHTML += `<img src="${img}" class="carousel-slide" style="display: ${
        index === 0 ? "block" : "none"
      }">`;
    });
    slidesHTML += `
      <button class="carousel-btn prev" onclick="moveSlide(-1)">&#10094;</button>
      <button class="carousel-btn next" onclick="moveSlide(1)">&#10095;</button>
    `;
    imgWrapper.innerHTML = slidesHTML;
  }
}

function moveSlide(n) {
  const slides = document.getElementsByClassName("carousel-slide");
  if (!slides.length) return;
  slides[currentSlideIndex].style.display = "none";
  currentSlideIndex += n;
  if (currentSlideIndex >= slides.length) currentSlideIndex = 0;
  if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
  slides[currentSlideIndex].style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

window.onclick = function (event) {
  const productModal = document.getElementById("productModal");
  const cartModal = document.getElementById("cartModal");
  if (event.target == productModal) productModal.style.display = "none";
  if (event.target == cartModal) cartModal.style.display = "none";
};

// --- AÑADIR AL CARRITO ---
const standardBtn = document.querySelector(".add-cart-btn");
if (standardBtn) {
  standardBtn.addEventListener("click", function () {
    const item = {
      id: Date.now(),
      name: currentProduct.name,
      price: currentProduct.currentPrice,
      variety: currentProduct.currentVariety,
    };

    cart.push(item);
    saveCart();
    updateCartUI();
    closeModal();
    toggleCart();
  });
}

// --- FUNCIONES CARRITO ---
function toggleCart() {
  const cartModal = document.getElementById("cartModal");
  cartModal.style.display =
    cartModal.style.display === "flex" ? "none" : "flex";
  if (cartModal.style.display === "flex") renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  if (cart.length === 0) {
    container.innerHTML = "<p class='empty-msg'>Tu carrito está vacío.</p>";
    document.getElementById("cart-total").innerText = "0.00";
    return;
  }
  let total = 0;
  cart.forEach((item) => {
    total += item.price;
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <div class="item-info"><h4>${item.name}</h4><span>${
      item.variety
    }</span><div><strong>${item.price.toFixed(2)}</strong></div></div>
      <span class="remove-item" onclick="removeFromCart(${item.id})">🗑️</span>`;
    container.appendChild(div);
  });
  document.getElementById("cart-total").innerText = total.toFixed(2);
}

function updateCartUI() {
  const countElement = document.getElementById("cart-count");
  if (countElement) countElement.innerText = cart.length;
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCartItems();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCartItems();
  updateCartUI();
}

function sendToWhatsapp() {
  if (cart.length === 0) return alert("El carrito está vacío.");
  let message = "Hola FungusLlampa, mi pedido:%0A%0A";
  let total = 0;
  cart.forEach((item, i) => {
    total += item.price;
    message += `${i + 1}. *${item.name}* - ${item.variety} (${item.price})%0A`;
  });
  message += `%0A*TOTAL: ${total.toFixed(
    2
  )}*%0A%0AMe gustaría más información sobre estos productos`;
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
}
