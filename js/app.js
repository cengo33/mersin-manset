// Local Storage News Data Initialization with Version Control
const NEWS_VERSION = 'v2_1779346684533';
if (localStorage.getItem('news_version') !== NEWS_VERSION) {
  localStorage.setItem('articles', JSON.stringify(newsData));
  localStorage.setItem('news_version', NEWS_VERSION);
}
let articles = JSON.parse(localStorage.getItem('articles'));

// State Management
let currentCategory = 'all';
let searchQuery = '';
let bookmarkedArticles = JSON.parse(localStorage.getItem('bookmarks')) || [];
let activeSlideIndex = 0;
let slideInterval = null;
let currentModalArticleId = null;
let modalFontSize = 1.0; // Font size multiplier

// DOM Elements Cache
const elements = {
  // Navigation
  navLinks: document.querySelectorAll('.nav-menu .nav-link'),
  categoryPills: document.getElementById('category-pills'),
  searchInput: document.getElementById('search-input'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  bookmarksToggleBtn: document.getElementById('bookmarks-toggle-btn'),
  bookmarkBadge: document.getElementById('bookmark-badge'),

  // Breaking News
  tickerSlider: document.getElementById('ticker-slider'),

  // Hero Grid (Slider)
  featuredSlider: document.getElementById('featured-slider'),
  sliderPrev: document.getElementById('slider-prev'),
  sliderNext: document.getElementById('slider-next'),
  sliderDots: document.getElementById('slider-dots'),

  // Sidebar widgets
  weatherTemp: document.getElementById('weather-temp'),
  weatherDesc: document.getElementById('weather-desc'),
  weatherIcon: document.getElementById('weather-icon'),
  usdVal: document.getElementById('usd-val'),
  usdChange: document.getElementById('usd-change'),
  eurVal: document.getElementById('eur-val'),
  eurChange: document.getElementById('eur-change'),
  bistVal: document.getElementById('bist-val'),
  bistChange: document.getElementById('bist-change'),
  xauVal: document.getElementById('xau-val'),
  xauChange: document.getElementById('xau-change'),
  trendingList: document.getElementById('trending-list'),

  // News Grid
  newsArticlesGrid: document.getElementById('news-articles-grid'),

  // Bookmarks Panel
  bookmarksPanel: document.getElementById('bookmarks-panel'),
  panelOverlay: document.getElementById('panel-overlay'),
  bookmarksCloseBtn: document.getElementById('bookmarks-close-btn'),
  bookmarksList: document.getElementById('bookmarks-list'),

  // Reader Modal
  modalOverlay: document.getElementById('modal-overlay'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalImage: document.getElementById('modal-image'),
  modalCategory: document.getElementById('modal-category'),
  modalTitle: document.getElementById('modal-title'),
  modalAvatar: document.getElementById('modal-avatar'),
  modalAuthor: document.getElementById('modal-author'),
  modalDate: document.getElementById('modal-date'),
  modalContent: document.getElementById('modal-content'),
  modalBookmarkBtn: document.getElementById('modal-bookmark-btn'),
  modalPrintBtn: document.getElementById('modal-print-btn'),
  modalShareBtn: document.getElementById('modal-share-btn'),
  fontDecBtn: document.getElementById('font-dec-btn'),
  fontIncBtn: document.getElementById('font-inc-btn'),

  // Scroll to Top
  scrollTopBtn: document.getElementById('scroll-top-btn'),

  // Toast
  toast: document.getElementById('toast-notification'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),

  // Footer Category clicks
  footerLinks: document.querySelectorAll('footer .footer-link[data-cat]'),

  // Sticky Ad Elements
  stickyBottomAd: document.getElementById('sticky-bottom-ad'),
  adCloseBtn: document.getElementById('ad-close-btn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderBreakingTicker();
  initSlider();
  initWidgets();
  renderNewsGrid();
  renderTrendingWidget();
  updateBookmarkBadge();
  initAdSimulation();
  setupEventListeners();
});

// Toast System
function showToast(message, type = 'success') {
  elements.toastMessage.textContent = message;
  
  if (type === 'danger') {
    elements.toast.classList.add('danger');
    elements.toastIcon.textContent = '✕';
  } else {
    elements.toast.classList.remove('danger');
    elements.toastIcon.textContent = '✓';
  }
  
  elements.toast.classList.add('show');
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Theme System
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  elements.themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(newTheme === 'dark' ? 'Gece modu aktif edildi' : 'Gündüz modu aktif edildi', 'success');
}

// Breaking News Ticker
function renderBreakingTicker() {
  // Use breaking items or first 4 articles
  const breakingNews = articles.filter(art => art.isBreaking);
  const fallbackNews = articles.slice(0, 4);
  const tickerItems = breakingNews.length > 0 ? breakingNews : fallbackNews;
  
  elements.tickerSlider.innerHTML = '';
  
  // Repeat twice for infinite loop effect
  const renderItems = [...tickerItems, ...tickerItems];
  renderItems.forEach(item => {
    const itemSpan = document.createElement('span');
    itemSpan.className = 'ticker-item';
    itemSpan.textContent = item.title;
    itemSpan.addEventListener('click', () => openArticleReader(item.id));
    elements.tickerSlider.appendChild(itemSpan);
  });
}

// Featured Carousel (Slider)
let featuredArticles = [];
function initSlider() {
  featuredArticles = articles.filter(art => art.isFeatured);
  if (featuredArticles.length === 0) {
    featuredArticles = articles.slice(0, 2);
  }

  // Clear existing slides and dots
  const oldSlides = elements.featuredSlider.querySelectorAll('.slide');
  oldSlides.forEach(slide => slide.remove());
  elements.sliderDots.innerHTML = '';

  featuredArticles.forEach((article, index) => {
    // Create Slide
    const slide = document.createElement('div');
    slide.className = `slide ${index === 0 ? 'active' : ''}`;
    slide.innerHTML = `
      <img src="${article.image}" alt="${article.title}" class="slide-img">
      <div class="slide-content">
        <span class="slide-category">${getCategoryName(article.category)}</span>
        <h3 class="slide-title">${article.title}</h3>
        <div class="slide-meta">
          <span>✍️ ${article.author}</span>
          <span>📅 ${article.date}</span>
          <span>⏱️ ${article.readTime}</span>
        </div>
      </div>
    `;
    
    // Clicking content opens article
    slide.querySelector('.slide-content').addEventListener('click', () => {
      openArticleReader(article.id);
    });

    elements.featuredSlider.insertBefore(slide, elements.sliderPrev);

    // Create Dot
    const dot = document.createElement('span');
    dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => setSlide(index));
    elements.sliderDots.appendChild(dot);
  });

  startSliderTimer();
}

function startSliderTimer() {
  stopSliderTimer();
  slideInterval = setInterval(() => {
    nextSlide();
  }, 5000);
}

function stopSliderTimer() {
  if (slideInterval) clearInterval(slideInterval);
}

function setSlide(index) {
  const slides = elements.featuredSlider.querySelectorAll('.slide');
  const dots = elements.sliderDots.querySelectorAll('.slider-dot');
  
  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;
  
  activeSlideIndex = index;
  
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function nextSlide() {
  setSlide(activeSlideIndex + 1);
}

function prevSlide() {
  setSlide(activeSlideIndex - 1);
}

// Widgets: Weather & Finance Simulation
function initWidgets() {
  // Weather Simulation
  const weatherStates = [
    { desc: 'Güneşli', icon: '☀️', tempMin: 22, tempMax: 27 },
    { desc: 'Parçalı Bulutlu', icon: '⛅', tempMin: 18, tempMax: 22 },
    { desc: 'Hafif Yağmurlu', icon: '🌦️', tempMin: 15, tempMax: 18 }
  ];
  
  let weatherIdx = Math.floor(Math.random() * weatherStates.length);
  let state = weatherStates[weatherIdx];
  let currentTemp = Math.floor(Math.random() * (state.tempMax - state.tempMin)) + state.tempMin;
  
  elements.weatherTemp.textContent = `${currentTemp}°C`;
  elements.weatherDesc.textContent = state.desc;
  elements.weatherIcon.textContent = state.icon;

  // Real-time weather fluctuation
  setInterval(() => {
    let change = Math.random() > 0.5 ? 1 : -1;
    let newTemp = currentTemp + change;
    if (newTemp >= state.tempMin && newTemp <= state.tempMax) {
      currentTemp = newTemp;
      elements.weatherTemp.textContent = `${currentTemp}°C`;
    }
  }, 10000);

  // Finance Simulation rates
  const stocks = {
    usd: { val: 32.48, change: 0.12, up: true },
    eur: { val: 35.24, change: -0.05, up: false },
    bist: { val: 10245, change: 0.35, up: true },
    xau: { val: 2452, change: 0.58, up: true }
  };

  setInterval(() => {
    // Fluctuates USD
    stocks.usd.change = parseFloat((Math.random() * 0.4 - 0.2).toFixed(2));
    stocks.usd.up = stocks.usd.change >= 0;
    stocks.usd.val = parseFloat((stocks.usd.val + (stocks.usd.change * 0.05)).toFixed(2));
    updateFinanceItem('usd', stocks.usd);

    // Fluctuates EUR
    stocks.eur.change = parseFloat((Math.random() * 0.4 - 0.2).toFixed(2));
    stocks.eur.up = stocks.eur.change >= 0;
    stocks.eur.val = parseFloat((stocks.eur.val + (stocks.eur.change * 0.05)).toFixed(2));
    updateFinanceItem('eur', stocks.eur);

    // Fluctuates BIST
    stocks.bist.change = parseFloat((Math.random() * 1.2 - 0.6).toFixed(2));
    stocks.bist.up = stocks.bist.change >= 0;
    stocks.bist.val = Math.floor(stocks.bist.val + (stocks.bist.change * 15));
    updateFinanceItem('bist', stocks.bist);

    // Fluctuates Gold
    stocks.xau.change = parseFloat((Math.random() * 1.5 - 0.5).toFixed(2));
    stocks.xau.up = stocks.xau.change >= 0;
    stocks.xau.val = Math.floor(stocks.xau.val + (stocks.xau.change * 8));
    updateFinanceItem('xau', stocks.xau);
  }, 4000);
}

function updateFinanceItem(id, data) {
  const valEl = document.getElementById(`${id}-val`);
  const changeEl = document.getElementById(`${id}-change`);
  
  if (!valEl || !changeEl) return;
  
  valEl.textContent = id === 'bist' || id === 'xau' 
    ? data.val.toLocaleString('tr-TR') 
    : data.val.toFixed(2);
    
  const symbol = data.up ? '▲' : '▼';
  const pctStr = `${symbol} %${Math.abs(data.change).toFixed(2)}`;
  
  changeEl.textContent = pctStr;
  if (data.up) {
    changeEl.className = 'fin-change change-up';
  } else {
    changeEl.className = 'fin-change change-down';
  }
}

// Trending Widget
function renderTrendingWidget() {
  elements.trendingList.innerHTML = '';
  // Top 5 trending items
  const trending = articles.slice(0, 5);
  trending.forEach((article, idx) => {
    const item = document.createElement('div');
    item.className = 'trending-item';
    item.innerHTML = `
      <span class="trending-num">${idx + 1}</span>
      <span class="trending-title">${article.title}</span>
    `;
    item.querySelector('.trending-title').addEventListener('click', () => {
      openArticleReader(article.id);
    });
    elements.trendingList.appendChild(item);
  });
}

// Category Translator
function getCategoryName(category) {
  const mapping = {
    'teknoloji': 'Teknoloji',
    'ekonomi': 'Ekonomi',
    'bilim': 'Bilim',
    'spor': 'Spor',
    'kultur': 'Kültür & Sanat',
    'dunya': 'Dünya'
  };
  return mapping[category] || category;
}

// Render News Card Grid
function renderNewsGrid() {
  elements.newsArticlesGrid.innerHTML = '';
  
  // Filter news
  let filteredNews = articles;
  
  // Filter by category
  if (currentCategory !== 'all') {
    filteredNews = filteredNews.filter(art => art.category === currentCategory);
  }
  
  // Filter by search query
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filteredNews = filteredNews.filter(art => 
      art.title.toLowerCase().includes(query) || 
      art.excerpt.toLowerCase().includes(query) ||
      art.content.toLowerCase().includes(query)
    );
  }
  
  if (filteredNews.length === 0) {
    elements.newsArticlesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <h3>Haber bulunamadı</h3>
        <p>Arama kriterlerinize uygun makale bulunmamaktadır. Lütfen farklı kelimeler deneyin.</p>
      </div>
    `;
    return;
  }
  
  filteredNews.forEach(article => {
    const isBookmarked = bookmarkedArticles.some(item => item.id === article.id);
    
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img-container">
        <img src="${article.image}" alt="${article.title}" class="card-img" loading="lazy">
        <span class="card-badge">${getCategoryName(article.category)}</span>
        <button class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" data-id="${article.id}" title="Okuma Listesine Ekle" aria-label="Yer İşareti">
          ${isBookmarked ? '★' : '☆'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span>📅 ${article.date}</span>
          <span>⏱️ ${article.readTime}</span>
        </div>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-excerpt">${article.excerpt}</p>
        <div class="card-footer">
          <span class="card-author">👤 ${article.author}</span>
          <button class="card-read-btn">Devamını Oku</button>
        </div>
      </div>
    `;
    
    // Add Event Listeners for Reading
    const openReader = () => openArticleReader(article.id);
    card.querySelector('.card-img').addEventListener('click', openReader);
    card.querySelector('.card-title').addEventListener('click', openReader);
    card.querySelector('.card-read-btn').addEventListener('click', openReader);
    
    // Bookmark Toggle Handler
    card.querySelector('.card-bookmark-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(article.id);
    });
    
    elements.newsArticlesGrid.appendChild(card);
  });
}

// Bookmarks logic
function toggleBookmark(id) {
  const index = bookmarkedArticles.findIndex(item => item.id === id);
  const article = articles.find(art => art.id === id);
  
  if (index > -1) {
    bookmarkedArticles.splice(index, 1);
    showToast('Haber okuma listenizden kaldırıldı.', 'danger');
  } else {
    bookmarkedArticles.push(article);
    showToast('Haber okuma listenize eklendi.', 'success');
  }
  
  localStorage.setItem('bookmarks', JSON.stringify(bookmarkedArticles));
  updateBookmarkBadge();
  renderBookmarksList();
  renderNewsGrid(); // refresh icons on grid
  updateModalBookmarkState(); // refresh in modal if open
}

function updateBookmarkBadge() {
  const count = bookmarkedArticles.length;
  if (count > 0) {
    elements.bookmarkBadge.textContent = count;
    elements.bookmarkBadge.style.display = 'flex';
  } else {
    elements.bookmarkBadge.style.display = 'none';
  }
}

// Render Bookmarks List inside panel
function renderBookmarksList() {
  elements.bookmarksList.innerHTML = '';
  
  if (bookmarkedArticles.length === 0) {
    elements.bookmarksList.innerHTML = `
      <p class="bookmark-empty">Okuma listeniz boş.<br>Haberlerdeki 🔖 simgesine tıklayarak listenize ekleyebilirsiniz.</p>
    `;
    return;
  }
  
  bookmarkedArticles.forEach(article => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.innerHTML = `
      <img src="${article.image}" alt="${article.title}" class="bookmark-img">
      <div class="bookmark-info">
        <h4 class="bookmark-title">${article.title}</h4>
        <button class="bookmark-remove" data-id="${article.id}">Kaldır ✕</button>
      </div>
    `;
    
    item.querySelector('.bookmark-title').addEventListener('click', () => {
      closeBookmarksPanel();
      openArticleReader(article.id);
    });
    
    item.querySelector('.bookmark-remove').addEventListener('click', () => {
      toggleBookmark(article.id);
    });
    
    elements.bookmarksList.appendChild(item);
  });
}

function openBookmarksPanel() {
  renderBookmarksList();
  elements.bookmarksPanel.classList.add('open');
  elements.panelOverlay.classList.add('show');
}

function closeBookmarksPanel() {
  elements.bookmarksPanel.classList.remove('open');
  elements.panelOverlay.classList.remove('show');
}

// Immersive Reader Modal
function openArticleReader(id) {
  const article = articles.find(art => art.id === id);
  if (!article) return;
  
  currentModalArticleId = id;
  modalFontSize = 1.0;
  applyModalFontSize();

  elements.modalImage.src = article.image;
  elements.modalImage.alt = article.title;
  elements.modalCategory.textContent = getCategoryName(article.category);
  elements.modalTitle.textContent = article.title;
  elements.modalAuthor.textContent = article.author;
  elements.modalDate.textContent = `${article.date} • ${article.readTime}`;
  elements.modalAvatar.textContent = article.author.charAt(0);
  elements.modalContent.innerHTML = article.content;
  
  updateModalBookmarkState();
  
  elements.modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden'; // lock scrolling background
}

function closeArticleReader() {
  elements.modalOverlay.classList.remove('show');
  document.body.style.overflow = 'auto'; // restore scrolling
  currentModalArticleId = null;
}

function updateModalBookmarkState() {
  if (!currentModalArticleId) return;
  const isBookmarked = bookmarkedArticles.some(item => item.id === currentModalArticleId);
  elements.modalBookmarkBtn.textContent = isBookmarked ? '★' : '🔖';
  elements.modalBookmarkBtn.title = isBookmarked ? 'Okuma Listesinden Çıkar' : 'Okuma Listesine Ekle';
}

function applyModalFontSize() {
  elements.modalContent.style.fontSize = `${modalFontSize}rem`;
}

// Setup Event Listeners
function setupEventListeners() {
  // Category Navigation
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      elements.navLinks.forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
      
      const cat = e.target.getAttribute('data-category');
      currentCategory = cat;
      
      // Update pills as well
      const pills = elements.categoryPills.querySelectorAll('.filter-pill');
      pills.forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-category') === cat);
      });
      
      renderNewsGrid();
    });
  });

  // Category Pills
  elements.categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    
    const pills = elements.categoryPills.querySelectorAll('.filter-pill');
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    const cat = pill.getAttribute('data-category');
    currentCategory = cat;
    
    // Update nav links as well
    elements.navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('data-category') === cat);
    });
    
    renderNewsGrid();
  });

  // Footer Category Clicks
  elements.footerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.getAttribute('data-cat');
      currentCategory = cat;
      
      // sync navigation
      elements.navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-category') === cat);
      });
      const pills = elements.categoryPills.querySelectorAll('.filter-pill');
      pills.forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-category') === cat);
      });
      
      renderNewsGrid();
      // Smooth scroll to articles grid
      document.querySelector('.filter-wrapper').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Search Input Handler (debounce/instant filter)
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNewsGrid();
  });

  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Bookmarks Panels Toggles
  elements.bookmarksToggleBtn.addEventListener('click', openBookmarksPanel);
  elements.bookmarksCloseBtn.addEventListener('click', closeBookmarksPanel);
  elements.panelOverlay.addEventListener('click', closeBookmarksPanel);

  // Slider buttons
  elements.sliderPrev.addEventListener('click', () => {
    prevSlide();
    startSliderTimer();
  });
  elements.sliderNext.addEventListener('click', () => {
    nextSlide();
    startSliderTimer();
  });
  elements.featuredSlider.addEventListener('mouseenter', stopSliderTimer);
  elements.featuredSlider.addEventListener('mouseleave', startSliderTimer);

  // Modal Actions
  elements.modalCloseBtn.addEventListener('click', closeArticleReader);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      closeArticleReader();
    }
  });

  // Modal bookmark click
  elements.modalBookmarkBtn.addEventListener('click', () => {
    if (currentModalArticleId) {
      toggleBookmark(currentModalArticleId);
    }
  });

  // Modal share click
  elements.modalShareBtn.addEventListener('click', () => {
    if (!currentModalArticleId) return;
    const dummyURL = `${window.location.origin}${window.location.pathname}?article=${currentModalArticleId}`;
    
    // Copy URL to clipboard
    navigator.clipboard.writeText(dummyURL).then(() => {
      showToast('Bağlantı başarıyla kopyalandı!', 'success');
    }).catch(err => {
      // Fallback
      showToast('Bağlantı kopyalanamadı.', 'danger');
    });
  });

  // Modal print click
  elements.modalPrintBtn.addEventListener('click', () => {
    window.print();
  });

  // FontSize Adjustments in Modal
  elements.fontIncBtn.addEventListener('click', () => {
    if (modalFontSize < 1.6) {
      modalFontSize += 0.1;
      applyModalFontSize();
    }
  });
  elements.fontDecBtn.addEventListener('click', () => {
    if (modalFontSize > 0.8) {
      modalFontSize -= 0.1;
      applyModalFontSize();
    }
  });

  // Scroll to Top behavior
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      elements.scrollTopBtn.classList.add('show');
    } else {
      elements.scrollTopBtn.classList.remove('show');
    }
  });

  elements.scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Sticky Bottom Ad close click handler
  if (elements.adCloseBtn && elements.stickyBottomAd) {
    elements.adCloseBtn.addEventListener('click', () => {
      elements.stickyBottomAd.classList.add('hidden');
    });
  }
}

// Ad Simulation System (Test Ads)
function initAdSimulation() {
  const adSlots = {
    'top-leaderboard-ad': {
      type: 'leaderboard',
      title: 'Mersin Marina Konutları\'nda Lansman Fırsatları',
      desc: 'Denize sıfır lüks daireler, %0.99 faiz oranı ve 60 ay vade seçeneğiyle sizleri bekliyor.',
      link: '#',
      btnText: 'Detaylı Bilgi',
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    },
    'sidebar-square-ad': {
      type: 'sidebar',
      title: 'Meşhur Mersin Tantunisi',
      desc: 'Eşsiz lezzet, gerçek odun ateşinde biftek ve kuzu eti seçenekleriyle! Paket servis indirim kodu: MANS20',
      link: '#',
      btnText: 'Sipariş Ver',
      bg: 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)'
    },
    'modal-in-article-ad': {
      type: 'in-article',
      title: 'Mersin Teknoloji Zirvesi 2026',
      desc: 'Yapay zeka ve dijitalleşmenin konuşulacağı büyük buluşma! Kayıtlar devam ediyor.',
      link: '#',
      btnText: 'Hemen Kaydol',
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
    },
    'sticky-bottom-ad': {
      type: 'sticky',
      title: 'Mersin Manşet Mobil Uygulaması Çok Yakında!',
      desc: 'Son dakika haberlerini kaçırmamak için bildirimlerinizi aktif edin.',
      link: '#',
      btnText: 'Takip Et',
      bg: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)'
    }
  };

  Object.entries(adSlots).forEach(([id, data]) => {
    const slot = document.getElementById(id);
    if (!slot) return;

    // Check if the slot has real AdSense active (an ins tag with adsbygoogle)
    const hasRealAd = slot.querySelector('ins.adsbygoogle');
    if (hasRealAd) return;

    // Create Mock Ad container
    const adContainer = document.createElement('a');
    adContainer.href = data.link;
    adContainer.target = '_blank';
    adContainer.className = `mock-ad-container ${data.type === 'sidebar' ? 'mock-ad-sidebar' : ''}`;
    adContainer.style.background = data.bg;

    // Add content based on type
    if (data.type === 'sticky') {
      adContainer.innerHTML = `
        <span class="mock-ad-badge">SPONSORLU</span>
        <div class="mock-ad-content">
          <span class="mock-ad-title">${data.title}</span>
          <span class="mock-ad-desc">${data.desc}</span>
        </div>
        <button class="mock-ad-btn">${data.btnText}</button>
      `;
      // Replace the placeholder class inside sticky bottom container but keep close button
      const placeholder = slot.querySelector('.adsense-placeholder');
      if (placeholder) {
        placeholder.replaceWith(adContainer);
      }
    } else {
      adContainer.innerHTML = `
        <span class="mock-ad-badge">SPONSORLU REKLAM</span>
        <div class="mock-ad-content">
          <span class="mock-ad-title">${data.title}</span>
          <span class="mock-ad-desc">${data.desc}</span>
        </div>
        <button class="mock-ad-btn">${data.btnText}</button>
      `;
      slot.innerHTML = '';
      slot.appendChild(adContainer);
    }
  });
}
