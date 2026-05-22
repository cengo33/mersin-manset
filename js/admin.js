// State Management with Version Control
const NEWS_VERSION = 'v2_1779437173401';
if (localStorage.getItem('news_version') !== NEWS_VERSION) {
  localStorage.setItem('articles', JSON.stringify(newsData));
  localStorage.setItem('news_version', NEWS_VERSION);
}
let articles = JSON.parse(localStorage.getItem('articles'));

let uploadedImageBase64 = '';

// DOM Elements Cache
const elements = {
  form: document.getElementById('add-news-form'),
  titleInput: document.getElementById('news-title'),
  categorySelect: document.getElementById('news-category'),
  authorInput: document.getElementById('news-author'),
  excerptInput: document.getElementById('news-excerpt'),
  contentInput: document.getElementById('news-content'),
  fileInput: document.getElementById('news-file-input'),
  isFeaturedInput: document.getElementById('news-is-featured'),
  isBreakingInput: document.getElementById('news-is-breaking'),
  
  // Dropzone
  dropzone: document.getElementById('news-dropzone'),
  dropzoneText: document.getElementById('dropzone-text'),
  previewContainer: document.getElementById('preview-container'),
  imgPreview: document.getElementById('dropzone-img-preview'),
  removePreviewBtn: document.getElementById('remove-preview-btn'),

  // Table
  newsTableBody: document.getElementById('admin-news-list'),
  totalArticlesCount: document.getElementById('total-articles-count'),
  
  // Theme & Toast
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  toast: document.getElementById('toast-notification'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),

  // RSS & AI elements
  rssSourceSelect: document.getElementById('rss-source-select'),
  fetchRssBtn: document.getElementById('fetch-rss-btn'),
  rssLoader: document.getElementById('rss-loader'),
  rssDraftList: document.getElementById('rss-draft-list'),
  aiRewriteBtn: document.getElementById('ai-rewrite-btn')
};

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderAdminNewsTable();
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

// Category Name translator and badge classes
function getCategoryName(category) {
  const mapping = {
    'teknoloji': 'Teknoloji',
    'ekonomi': 'Ekonomi',
    'bilim': 'Bilim',
    'spor': 'Spor',
    'kultur': 'Kültür',
    'dunya': 'Dünya'
  };
  return mapping[category] || category;
}

// Render News Management Table
function renderAdminNewsTable() {
  elements.newsTableBody.innerHTML = '';
  
  // Reload fresh data from localStorage
  articles = JSON.parse(localStorage.getItem('articles')) || [];
  elements.totalArticlesCount.textContent = articles.length;

  if (articles.length === 0) {
    elements.newsTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          Yayınlanmış haber bulunamadı. Hemen sol taraftan yeni bir haber ekleyin!
        </td>
      </tr>
    `;
    return;
  }

  // Reverse list to show the latest articles first
  const displayList = [...articles].reverse();

  displayList.forEach(article => {
    const row = document.createElement('tr');
    
    // Fallback category color codes for badges
    let badgeStyle = '';
    switch(article.category) {
      case 'teknoloji': badgeStyle = 'background: rgba(37, 99, 235, 0.1); color: #2563eb;'; break;
      case 'ekonomi': badgeStyle = 'background: rgba(16, 185, 129, 0.1); color: #10b981;'; break;
      case 'bilim': badgeStyle = 'background: rgba(139, 92, 246, 0.1); color: #8b5cf6;'; break;
      case 'spor': badgeStyle = 'background: rgba(245, 158, 11, 0.1); color: #f59e0b;'; break;
      case 'kultur': badgeStyle = 'background: rgba(236, 72, 153, 0.1); color: #ec4899;'; break;
      default: badgeStyle = 'background: rgba(100, 116, 139, 0.1); color: #64748b;';
    }

    row.innerHTML = `
      <td><img src="${article.image}" alt="" class="table-img"></td>
      <td style="font-weight: 600; font-size: 0.88rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${article.title}">
        ${article.title}
        ${article.isFeatured ? '<span style="font-size:0.7rem; color:var(--accent); font-weight:bold; margin-left:0.3rem;">[Öne Çıkan]</span>' : ''}
        ${article.isBreaking ? '<span style="font-size:0.7rem; color:var(--danger); font-weight:bold; margin-left:0.3rem;">[Son Dakika]</span>' : ''}
      </td>
      <td><span class="table-badge" style="${badgeStyle}">${getCategoryName(article.category)}</span></td>
      <td style="font-size:0.8rem; color:var(--text-muted);">${article.date}</td>
      <td style="text-align: center;">
        <button class="delete-btn" data-id="${article.id}" title="Haberi Sil" aria-label="Sil">🗑️</button>
      </td>
    `;

    row.querySelector('.delete-btn').addEventListener('click', () => {
      deleteArticle(article.id);
    });

    elements.newsTableBody.appendChild(row);
  });
}

// Delete Article Logic
function deleteArticle(id) {
  if (confirm('Bu haberi kalıcı olarak silmek istediğinize emin misiniz?')) {
    articles = articles.filter(art => art.id !== id);
    localStorage.setItem('articles', JSON.stringify(articles));
    
    // Also clean from bookmarks
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarks = bookmarks.filter(item => item.id !== id);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

    renderAdminNewsTable();
    showToast('Haber başarıyla silindi.', 'danger');
  }
}

// Image File Processing & Canvas Optimization
function handleImageFile(file) {
  if (!file.type.match('image.*')) {
    showToast('Lütfen geçerli bir resim dosyası seçin.', 'danger');
    return;
  }

  // Visual feedback
  elements.dropzoneText.textContent = 'Görsel işleniyor ve optimize ediliyor...';

  const reader = new FileReader();
  reader.onload = (event) => {
    optimizeImage(event.target.result, (optimizedBase64) => {
      uploadedImageBase64 = optimizedBase64;
      elements.imgPreview.src = optimizedBase64;
      elements.dropzoneText.style.display = 'none';
      elements.previewContainer.style.display = 'block';
      showToast('Görsel başarıyla yüklendi ve optimize edildi.', 'success');
    });
  };
  reader.readAsDataURL(file);
}

// Resizes image to standard width (1000px max) and compresses to JPEG (quality 0.7)
// to prevent localStorage quota (5MB) exhaustion!
function optimizeImage(base64Str, callback) {
  const img = new Image();
  img.src = base64Str;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    
    const maxDimension = 1000;
    
    // Maintain aspect ratio
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Output compressed JPEG
    const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.72);
    callback(optimizedBase64);
  };
  img.onerror = () => {
    // Fail-safe: return original if canvas load fails
    callback(base64Str);
  };
}

function removePreview() {
  uploadedImageBase64 = '';
  elements.fileInput.value = '';
  elements.imgPreview.src = '';
  elements.previewContainer.style.display = 'none';
  elements.dropzoneText.style.display = 'block';
  elements.dropzoneText.textContent = 'Dosya sürükleyin, tıklayarak seçin veya resmi kopyalayıp buraya yapıştırın (Ctrl+V)';
}

// Generate human readable date
function getFormattedDate() {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Event Listeners Configuration
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Dropzone click triggers hidden file input
  elements.dropzone.addEventListener('click', (e) => {
    // Prevent triggering file dialog when clicking remove button
    if (e.target.closest('#remove-preview-btn')) return;
    elements.fileInput.click();
  });

  // File input change
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  });

  // Remove preview
  elements.removePreviewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removePreview();
  });

  // Drag and Drop Events
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'dragend', 'drop'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropzone.classList.remove('dragover');
    }, false);
  });

  elements.dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  }, false);

  // Clipboard Paste Event Listener (Ctrl + V)
  // Listen globally to let users paste images seamlessly anywhere on the form!
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
        const blob = item.getAsFile();
        handleImageFile(blob);
        showToast('Resim panodan başarıyla yapıştırıldı!', 'success');
        break; // only process the first image
      }
    }
  });

  // Form Submit Handler
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = elements.titleInput.value.trim();
    const category = elements.categorySelect.value;
    const author = elements.authorInput.value.trim();
    const excerpt = elements.excerptInput.value.trim();
    const content = elements.contentInput.value.trim();
    const isFeatured = elements.isFeaturedInput.checked;
    const isBreaking = elements.isBreakingInput.checked;

    // Use default category images as a fallback if no image is uploaded
    let finalImage = uploadedImageBase64;
    if (!finalImage) {
      const fallbackImages = {
        'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
        'bilim': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        'spor': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
        'kultur': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
        'dunya': 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80'
      };
      finalImage = fallbackImages[category] || fallbackImages['teknoloji'];
    }

    // Auto-calculate reading time based on content word count (~200 words per minute)
    const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    const readTime = `${readMinutes} dk okuma`;

    // Create New Article Object
    const newArticle = {
      id: `art-${Date.now()}`,
      title: title,
      excerpt: excerpt,
      content: content,
      category: category,
      date: getFormattedDate(),
      author: author,
      readTime: readTime,
      image: finalImage,
      isFeatured: isFeatured,
      isBreaking: isBreaking
    };

    // Save to Local Storage
    articles = JSON.parse(localStorage.getItem('articles')) || [];
    
    // If this is set as featured, and we want only clean featured slider list
    // (We just append it, and the app will load it correctly)
    articles.push(newArticle);
    localStorage.setItem('articles', JSON.stringify(articles));

    // Reset UI State
    elements.form.reset();
    removePreview();
    
    renderAdminNewsTable();
    showToast('Haber başarıyla yayınlandı!', 'success');
  });

  // RSS & AI Event Listeners
  if (elements.fetchRssBtn) {
    elements.fetchRssBtn.addEventListener('click', fetchRSSNews);
  }
  if (elements.aiRewriteBtn) {
    elements.aiRewriteBtn.addEventListener('click', rewriteContentWithAI);
  }
}

// Fetch RSS News
function fetchRSSNews() {
  const rssUrl = elements.rssSourceSelect.value;
  elements.rssLoader.style.display = 'block';
  elements.rssDraftList.innerHTML = '';
  
  // Public CORS Proxy: allorigins.win
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
  
  fetch(proxyUrl)
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('RSS verisi çekilemedi.');
    })
    .then(data => {
      elements.rssLoader.style.display = 'none';
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, "text/xml");
      const items = xmlDoc.querySelectorAll("item");
      
      if (!items || items.length === 0) {
        elements.rssDraftList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 1rem; margin: 0;">Hiçbir haber bulunamadı veya RSS formatı uyumsuz.</p>`;
        return;
      }
      
      elements.rssDraftList.innerHTML = '';
      
      // Load top 8 items
      const limit = Math.min(items.length, 8);
      for (let i = 0; i < limit; i++) {
        const item = items[i];
        const title = item.querySelector("title")?.textContent || "Başlıksız Haber";
        const desc = item.querySelector("description")?.textContent || "";
        
        // Clean description from tags
        const cleanDesc = desc.replace(/<[^>]*>/g, '').trim();
        
        // Find image
        let image = "";
        const enclosure = item.querySelector("enclosure");
        if (enclosure) {
          image = enclosure.getAttribute("url") || "";
        }
        if (!image) {
          const mediaContent = item.querySelector("media\\:content, content");
          if (mediaContent) {
            image = mediaContent.getAttribute("url") || "";
          }
        }
        if (!image && desc.includes("<img")) {
          const match = desc.match(/src="([^"]+)"/);
          if (match) image = match[1];
        }
        if (!image) {
          // default placeholder image
          image = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
        }
        
        // Create draft card elements
        const draftCard = document.createElement('div');
        draftCard.className = 'draft-card';
        draftCard.style = 'display: flex; gap: 0.8rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.6rem; align-items: center; transition: transform 0.2s ease;';
        
        // Hover effect helper in JS
        draftCard.onmouseenter = () => draftCard.style.transform = 'translateY(-2px)';
        draftCard.onmouseleave = () => draftCard.style.transform = 'translateY(0)';

        draftCard.innerHTML = `
          <img src="${image}" alt="" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
          <div style="flex-grow: 1; min-width: 0;">
            <h4 style="font-size: 0.82rem; font-weight: 700; margin: 0 0 0.2rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);" title="${title}">${title}</h4>
            <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${cleanDesc}</p>
          </div>
          <button type="button" class="import-draft-btn btn-primary" style="padding: 0.35rem 0.7rem; font-size: 0.72rem; border-radius: 6px; border: none; font-weight: bold; cursor: pointer; flex-shrink: 0; white-space: nowrap; background: var(--accent-gradient); color: #fff;">Aktar</button>
        `;
        
        // Button event listener
        draftCard.querySelector('.import-draft-btn').addEventListener('click', () => {
          importDraftToForm(title, cleanDesc, image);
        });
        
        elements.rssDraftList.appendChild(draftCard);
      }
      
      showToast(`${limit} adet güncel haber kaynaktan çekildi.`, 'success');
    })
    .catch(err => {
      elements.rssLoader.style.display = 'none';
      elements.rssDraftList.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 1rem; margin: 0;">❌ Haberler çekilemedi. Lütfen tekrar deneyin.</p>`;
      showToast('Haberler yüklenirken bir hata oluştu.', 'danger');
      console.error(err);
    });
}

// Import Draft Data to Form fields
function importDraftToForm(title, desc, image) {
  elements.titleInput.value = title;
  elements.excerptInput.value = desc.substring(0, 150) + (desc.length > 150 ? '...' : '');
  
  // Set content body
  elements.contentInput.value = `<p>${desc}</p>\n\n<p>İçeriğin detayları gelişmeye devam ediyor. Konuya ilişkin güncel bilgileri takip etmeye devam edin.</p>`;
  
  // Update image
  uploadedImageBase64 = image;
  elements.imgPreview.src = image;
  elements.dropzoneText.style.display = 'none';
  elements.previewContainer.style.display = 'block';
  
  // Auto-select category based on title keywords
  const titleLower = title.toLowerCase();
  if (titleLower.includes('faiz') || titleLower.includes('enflasyon') || titleLower.includes('dolar') || titleLower.includes('ekonomi') || titleLower.includes('borsa') || titleLower.includes('para') || titleLower.includes('tcmb')) {
    elements.categorySelect.value = 'ekonomi';
  } else if (titleLower.includes('yapay zeka') || titleLower.includes('teknoloji') || titleLower.includes('telefon') || titleLower.includes('robot') || titleLower.includes('ai') || titleLower.includes('yazılım')) {
    elements.categorySelect.value = 'teknoloji';
  } else if (titleLower.includes('uzay') || titleLower.includes('mars') || titleLower.includes('bilim') || titleLower.includes('keşif') || titleLower.includes('tıp') || titleLower.includes('hücre')) {
    elements.categorySelect.value = 'bilim';
  } else if (titleLower.includes('maç') || titleLower.includes('spor') || titleLower.includes('futbol') || titleLower.includes('basketbol') || titleLower.includes('tenis') || titleLower.includes('kupa')) {
    elements.categorySelect.value = 'spor';
  } else if (titleLower.includes('sergi') || titleLower.includes('tiyatro') || titleLower.includes('sinema') || titleLower.includes('sanat') || titleLower.includes('fuar') || titleLower.includes('kültür')) {
    elements.categorySelect.value = 'kultur';
  } else {
    elements.categorySelect.value = 'dunya';
  }
  
  // Focus on content text area
  elements.contentInput.focus();
  
  showToast('Haber taslağı forma aktarıldı. Şimdi özgünleştirebilirsiniz!', 'success');
}

// AI Rewriting simulation engine
function rewriteContentWithAI() {
  const originalContent = elements.contentInput.value.trim();
  if (!originalContent) {
    showToast('Lütfen önce içerik alanına metin girin veya bir haber aktarın.', 'danger');
    return;
  }
  
  // Set UI state for button
  const originalBtnText = elements.aiRewriteBtn.innerHTML;
  elements.aiRewriteBtn.innerHTML = '⚡ AI Düzenliyor...';
  elements.aiRewriteBtn.disabled = true;
  
  setTimeout(() => {
    // Strip XML comments
    let workingText = originalContent.replace(/<!--[\s\S]*?-->/g, '');
    
    // Strip HTML paragraph tags briefly to rewrite pure sentences
    let textOnly = workingText.replace(/<\/?p>/g, '\n').trim();
    
    // Turkish synonym / restructuring vocabulary map
    const synonyms = [
      { key: /merkez bankası/gi, val: 'para politikası otoritesi' },
      { key: /açıklandı/gi, val: 'resmen kamuoyuna duyuruldu' },
      { key: /açıklama yaptı/gi, val: 'önemli açıklamalarda bulundu' },
      { key: /bildirildi/gi, val: 'aktarıldı' },
      { key: /haberine göre/gi, val: 'yansımalarına bakıldığında' },
      { key: /ve/g, val: 've aynı zamanda' },
      { key: /büyük/gi, val: 'muazzam' },
      { key: /yeni/gi, val: 'yenilikçi' },
      { key: /son dakika/gi, val: 'gelişmeler doğrultusunda' },
      { key: /tahmin/gi, val: 'öngörü' },
      { key: /karar/gi, val: 'stratejik adım' },
      { key: /enflasyon/gi, val: 'fiyat artışı dalgalanması' },
      { key: /faiz/gi, val: 'politika oranları' },
      { key: /insanlar/gi, val: 'bireyler' },
      { key: /teknoloji/gi, val: 'teknolojik ekosistem' },
      { key: /gelişme/gi, val: 'ilerleme' },
      { key: /dünya/gi, val: 'küresel ölçek' }
    ];
    
    // Apply transformations
    synonyms.forEach(pair => {
      textOnly = textOnly.replace(pair.key, pair.val);
    });
    
    // Break into sentences
    const sentences = textOnly.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    
    // Construct unique HTML structure
    let finalHTML = '';
    
    if (sentences.length > 0) {
      // First paragraph
      finalHTML += `<p>${sentences.slice(0, Math.ceil(sentences.length / 3)).join('. ')}.</p>\n\n`;
      
      // Custom H3 Alt Başlık based on category
      const cat = elements.categorySelect.value;
      let h3Title = 'Sürecin Getirdiği Yenilikler ve Beklentiler';
      if (cat === 'ekonomi') h3Title = 'Piyasalarda Kritik Beklentiler ve Analist Yorumları';
      if (cat === 'teknoloji') h3Title = 'Geleceğin Dijital Altyapısı ve Güvenlik Parametreleri';
      if (cat === 'bilim') h3Title = 'Araştırmanın Tıp ve Moleküler Alandaki Yansımaları';
      if (cat === 'spor') h3Title = 'Müsabakanın Teknik Ayrıntıları ve Spor Kamuoyu Tepkileri';
      if (cat === 'kultur') h3Title = 'Kültürel Estetik ve Endüstriyel Tasarımda Yeni Boyutlar';
      
      finalHTML += `<h3>${h3Title}</h3>\n`;
      
      // Second paragraph
      const midStart = Math.ceil(sentences.length / 3);
      const midEnd = Math.ceil(sentences.length * 2 / 3);
      finalHTML += `<p>${sentences.slice(midStart, midEnd).join('. ')}.</p>\n\n`;
      
      // Add a blockquote
      let quoteText = '"Bu dinamik gelişmeler, uzun vadede sektörel dengeleri yeniden inşa edecek güçtedir."';
      if (cat === 'ekonomi') quoteText = '"Sıkı tedbirlerin ve piyasa disiplininin sürdürülmesi orta vadeli istikrarın teminatıdır."';
      if (cat === 'teknoloji') quoteText = '"Ajan mimarileri ve yerel çipler, internet olmadan dahi akıllı kararların anahtarı haline geliyor."';
      
      finalHTML += `<blockquote>\n  ${quoteText}\n</blockquote>\n\n`;
      
      // Last paragraph
      finalHTML += `<p>${sentences.slice(midEnd).join('. ')}.</p>`;
    } else {
      finalHTML = `<p>${textOnly}</p>`;
    }
    
    // Update content area
    elements.contentInput.value = finalHTML;
    
    // Reset button UI
    elements.aiRewriteBtn.innerHTML = originalBtnText;
    elements.aiRewriteBtn.disabled = false;
    
    showToast('Yapay Zeka içeriği AdSense uyumlu şekilde özgünleştirdi!', 'success');
  }, 1000);
}
