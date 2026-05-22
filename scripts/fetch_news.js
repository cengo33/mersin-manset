const fs = require('fs');
const path = require('path');

// RSS sources
const RSS_SOURCES = [
  { url: 'https://www.trthaber.com/xml_mobile.rss', source: 'TRT Haber' },
  { url: 'https://www.trthaber.com/manset_articles.rss', source: 'TRT Haber Son Dakika' },
  { url: 'https://www.ntv.com.tr/gundem.rss', source: 'NTV Haber' }
];

// Fallback images based on category
const FALLBACK_IMAGES = {
  'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  'bilim': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'spor': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
  'kultur': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
  'dunya': 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80'
};

// Turkish Editor names list
const AUTHORS = [
  'Merve Yılmaz', 'Kaan Demir', 'Elif Kaya', 'Burak Çelik', 
  'Selin Öztürk', 'Arda Şahin', 'Zeynep Yıldız', 'Onur Koç'
];

// Synonyms map for unique content generation (AdSense compliant)
const SYNONYMS = [
  { key: /merkez bankası/gi, val: 'para politikası otoritesi' },
  { key: /açıklandı/gi, val: 'kamuoyuyla resmen paylaşıldı' },
  { key: /açıklama yaptı/gi, val: 'kamuoyuna önemli açıklamalarda bulundu' },
  { key: /belirtildi/gi, val: 'özellikle ifade edildi' },
  { key: /bildirildi/gi, val: 'kamuoyuna aktarıldı' },
  { key: /haberine göre/gi, val: 'basına yansıyan detaylara göre' },
  { key: /büyük/gi, val: 'oldukça geniş çaplı' },
  { key: /yeni/gi, val: 'yeni nesil' },
  { key: /son dakika/gi, val: 'sıcak gelişmeler kapsamında' },
  { key: /tahmin/gi, val: 'uzman öngörüsü' },
  { key: /karar/gi, val: 'kritik karar adımı' },
  { key: /enflasyon/gi, val: 'fiyat artışı dalgalanması' },
  { key: /faiz/gi, val: 'politika oranları' },
  { key: /insanlar/gi, val: 'vatandaşlar' },
  { key: /teknoloji/gi, val: 'teknolojik ekosistem' },
  { key: /gelişme/gi, val: 'ilerleme' },
  { key: /dünya/gi, val: 'küresel ölçek' },
  { key: /yapıldı/gi, val: 'gerçekleştirildi' },
  { key: /başladı/gi, val: 'başlangıç gösterdi' },
  { key: /oldu/gi, val: 'meydana geldi' },
  { key: /dedi/gi, val: 'ifadelerini kullandı' },
  { key: /açıklama/gi, val: 'resmi beyanat' },
  { key: /çalışma/gi, val: 'araştırma ve geliştirme faaliyeti' },
  { key: /önemli/gi, val: 'büyük öneme sahip' },
  { key: /ilk/gi, val: 'ilk aşamadaki' },
  { key: /türkiye/gi, val: 'ülkemiz genelinde' },
  { key: /bakanı/gi, val: 'bakanlık yetkilisi' }
];

// Helper to clean HTML tags
function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Category detector
function detectCategory(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('faiz') || text.includes('enflasyon') || text.includes('dolar') || text.includes('ekonomi') || text.includes('borsa') || text.includes('para') || text.includes('tcmb') || text.includes('piyasa') || text.includes('ihracat') || text.includes('ithalat') || text.includes('vergi')) {
    return 'ekonomi';
  }
  if (text.includes('yapay zeka') || text.includes('teknoloji') || text.includes('telefon') || text.includes('robot') || text.includes('ai') || text.includes('yazılım') || text.includes('uzay') || text.includes('çip') || text.includes('siber') || text.includes('internet')) {
    return 'teknoloji';
  }
  if (text.includes('keşif') || text.includes('bilim') || text.includes('tıp') || text.includes('hücre') || text.includes('dna') || text.includes('araştırma') || text.includes('gezegen') || text.includes('fizik') || text.includes('kimya') || text.includes('laboratuvar')) {
    return 'bilim';
  }
  if (text.includes('maç') || text.includes('spor') || text.includes('futbol') || text.includes('basketbol') || text.includes('tenis') || text.includes('kupa') || text.includes('stadyum') || text.includes('antrenör') || text.includes('şampiyon') || text.includes('derbi')) {
    return 'spor';
  }
  if (text.includes('sergi') || text.includes('tiyatro') || text.includes('sinema') || text.includes('sanat') || text.includes('fuar') || text.includes('kültür') || text.includes('müze') || text.includes('kitap') || text.includes('konser') || text.includes('ressam')) {
    return 'kultur';
  }
  return 'dunya';
}

// Unique formatter & synonym rewriter (AdSense optimization)
function rewriteContent(title, desc, category) {
  let text = desc;
  if (text.length < 50) {
    text = desc + " " + title + " detayları ve kamuoyuna yansıyan son dakika gelişmeleri uzman ekiplerimiz tarafından yakından takip ediliyor.";
  }

  // Apply synonyms
  SYNONYMS.forEach(pair => {
    text = text.replace(pair.key, pair.val);
  });

  // Break text into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);

  let finalHTML = '';
  const mid = Math.ceil(sentences.length / 3);

  // 1. First Paragraph
  const p1Sentences = sentences.slice(0, mid);
  if (p1Sentences.length > 0) {
    finalHTML += `<p>${p1Sentences.join('. ')}.</p>\n\n`;
  } else {
    finalHTML += `<p>${text}</p>\n\n`;
  }

  // 2. Headings & 2nd Paragraph
  let h3Title = 'Sürecin Getirdiği Yenilikler ve Beklentiler';
  if (category === 'ekonomi') h3Title = 'Piyasalarda Kritik Beklentiler ve Analist Yorumları';
  if (category === 'teknoloji') h3Title = 'Geleceğin Dijital Altyapısı ve Güvenlik Parametreleri';
  if (category === 'bilim') h3Title = 'Araştırmanın Tıp ve Moleküler Alandaki Yansımaları';
  if (category === 'spor') h3Title = 'Müsabakanın Teknik Ayrıntıları ve Spor Kamuoyu Tepkileri';
  if (category === 'kultur') h3Title = 'Kültürel Estetik ve Endüstriyel Tasarımda Yeni Boyutlar';
  if (category === 'dunya') h3Title = 'Küresel Ölçekte Diplomatik ve Siyasi Yansımaları';

  finalHTML += `<h3>${h3Title}</h3>\n`;

  const p2Sentences = sentences.slice(mid, mid * 2);
  if (p2Sentences.length > 0) {
    finalHTML += `<p>${p2Sentences.join('. ')}.</p>\n\n`;
  } else {
    finalHTML += `<p>Söz konusu gelişmelerin sektörel bazda yaratacağı etkiler ve gelecek döneme ilişkin makro göstergeler analistler tarafından incelenmeye devam ediliyor.</p>\n\n`;
  }

  // 3. Blockquote
  let quoteText = '"Bu dinamik gelişmeler, uzun vadede sektörel dengeleri yeniden inşa edecek güçtedir."';
  if (category === 'ekonomi') quoteText = '"Sıkı tedbirlerin ve piyasa disiplininin sürdürülmesi orta vadeli istikrarın teminatıdır."';
  if (category === 'teknoloji') quoteText = '"Yapay zeka ve uç bilişim entegrasyonu, veri egemenliğinin korunmasında en kritik aşamadır."';
  if (category === 'bilim') quoteText = '"Biyolojik mekanizmaları moleküler düzeyde anlayabilmek, tedavisi imkansız kabul edilen hastalıkların çözüm anahtarıdır."';
  if (category === 'dunya') quoteText = '"Küresel diplomasi kanallarının açık tutulması, bölgesel istikrarın ve barışın sürdürülebilirliği için elzemdir."';

  finalHTML += `<blockquote>\n  ${quoteText}\n</blockquote>\n\n`;

  // 4. Third Paragraph
  const p3Sentences = sentences.slice(mid * 2);
  if (p3Sentences.length > 0) {
    finalHTML += `<p>${p3Sentences.join('. ')}.</p>\n\n`;
  } else {
    finalHTML += `<p>Gelişmelerin seyri doğrultusunda yaşanacak yeni gelişmeleri ve resmi kurumların yapacağı açıklamaları anlık olarak aktarmaya devam edeceğiz.</p>\n\n`;
  }

  // Rewrite Title for uniqueness
  let rewrittenTitle = title;
  SYNONYMS.slice(0, 8).forEach(pair => {
    rewrittenTitle = rewrittenTitle.replace(pair.key, pair.val);
  });
  // Make title capital case / sentence case or append a professional touch
  if (!rewrittenTitle.endsWith('.')) {
    rewrittenTitle = rewrittenTitle + ' Gelişmeleri';
  }

  return {
    title: rewrittenTitle.replace(/ Gelişmeleri Gelişmeleri$/, ' Gelişmeleri').trim(),
    content: finalHTML
  };
}

// Fetch RSS XML contents using native fetch
async function fetchRssFeed(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error(`Error fetching RSS feed ${url}:`, err.message);
    return null;
  }
}

// Parse XML using regex (supports RSS and Atom formats)
function parseRssXml(xml) {
  const items = [];
  if (!xml) return items;

  // Try RSS items first
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];

    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const title = titleMatch ? cleanHtml(titleMatch[1]) : '';

    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    const desc = descMatch ? cleanHtml(descMatch[1]) : '';

    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
    const link = linkMatch ? cleanHtml(linkMatch[1]) : '';

    // Find image
    let image = '';
    const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    if (enclosureMatch) {
      image = enclosureMatch[1];
    }
    if (!image) {
      const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      if (mediaMatch) {
        image = mediaMatch[1];
      }
    }
    if (!image && descMatch && descMatch[1].includes('<img')) {
      const imgInDesc = descMatch[1].match(/src=["']([^"']+)["']/i);
      if (imgInDesc) image = imgInDesc[1];
    }

    if (title && desc) {
      items.push({ title, desc, link, image });
    }
  }

  // Try Atom entries next if no items found
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryContent = match[1];

      const titleMatch = entryContent.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const title = titleMatch ? cleanHtml(titleMatch[1]) : '';

      const summaryMatch = entryContent.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/);
      const desc = summaryMatch ? cleanHtml(summaryMatch[1]) : '';

      const linkMatch = entryContent.match(/<link[^>]+href=["']([^"']+)["']/i);
      const link = linkMatch ? cleanHtml(linkMatch[1]) : '';

      let image = '';
      const enclosureMatch = entryContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      }
      if (!image) {
        const mediaMatch = entryContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        if (mediaMatch) {
          image = mediaMatch[1];
        }
      }
      if (!image) {
        const contentMatch = entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/);
        if (contentMatch && contentMatch[1].includes('<img')) {
          const imgInContent = contentMatch[1].match(/src=["']([^"']+)["']/i);
          if (imgInContent) image = imgInContent[1];
        }
      }

      if (title && desc) {
        items.push({ title, desc, link, image });
      }
    }
  }

  return items;
}

// Formatted Turkish Date
function getFormattedTurkishDate() {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function start() {
  console.log('--- Haber Çekme ve AdSense Uyumlu Özgünleştirme İşlemi Başladı ---');
  
  // Load existing news data
  const newsDataPath = path.join(__dirname, '../js/newsData.js');
  let newsData = [];
  if (fs.existsSync(newsDataPath)) {
    const fileContent = fs.readFileSync(newsDataPath, 'utf8');
    // Extract array content using regex or evaluating it in a safe vm context.
    // For simplicity, we can load it by matching and evaluating the array,
    // or just requiring it if we wrap it. Since we are in Node, let's require it!
    try {
      newsData = require(newsDataPath);
    } catch (e) {
      console.error('newsData load error, falling back to manual parse:', e.message);
      // fallback manual parse
      const arrayMatch = fileContent.match(/const newsData = ([\s\S]*?);/);
      if (arrayMatch) {
        try {
          newsData = eval(arrayMatch[1]);
        } catch (err) {
          newsData = [];
        }
      }
    }
  }

  console.log(`Mevcut haber veritabanında ${newsData.length} haber bulunuyor.`);

  let newlyFetchedCount = 0;
  const processedTitles = new Set(newsData.map(a => a.title.toLowerCase()));

  for (const source of RSS_SOURCES) {
    console.log(`\n[${source.source}] kaynağından veriler çekiliyor...`);
    const xml = await fetchRssFeed(source.url);
    const rawArticles = parseRssXml(xml);
    console.log(`[${source.source}] ${rawArticles.length} adet ham haber öğesi ayrıştırıldı.`);

    // Take top 4 from each feed to ensure variety and quality
    const limit = Math.min(rawArticles.length, 4);
    let importedFromFeed = 0;

    for (let i = 0; i < rawArticles.length && importedFromFeed < limit; i++) {
      const rawArt = rawArticles[i];
      
      // Basic check for uniqueness
      if (processedTitles.has(rawArt.title.toLowerCase())) {
        continue; // already exists
      }

      const category = detectCategory(rawArt.title, rawArt.desc);
      const rewritten = rewriteContent(rawArt.title, rawArt.desc, category);
      
      // Double check title rewrite uniqueness
      if (processedTitles.has(rewritten.title.toLowerCase())) {
        continue;
      }

      // Calculate read time
      const wordCount = rewritten.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
      const readMinutes = Math.max(1, Math.ceil(wordCount / 180)); // 180 wpm
      const readTime = `${readMinutes} dk okuma`;

      // Set image URL
      const finalImage = rawArt.image || FALLBACK_IMAGES[category] || FALLBACK_IMAGES['teknoloji'];

      // Random Author
      const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];

      const newArticle = {
        id: `art-rss-${Date.now()}-${newlyFetchedCount}`,
        title: rewritten.title,
        excerpt: rawArt.desc.substring(0, 150) + (rawArt.desc.length > 150 ? '...' : ''),
        content: rewritten.content,
        category: category,
        date: getFormattedTurkishDate(),
        author: author,
        readTime: readTime,
        image: finalImage,
        isFeatured: Math.random() > 0.7, // 30% chance of featured
        isBreaking: Math.random() > 0.8  // 20% chance of breaking
      };

      newsData.unshift(newArticle); // prepend to show first as latest news
      processedTitles.add(rawArt.title.toLowerCase());
      processedTitles.add(rewritten.title.toLowerCase());
      newlyFetchedCount++;
      importedFromFeed++;
    }

    console.log(`[${source.source}] kaynağından ${importedFromFeed} adet yeni özgün haber eklendi.`);
  }

  if (newlyFetchedCount > 0) {
    // Keep max 20 articles in database to prevent localStorage overflow
    if (newsData.length > 20) {
      newsData = newsData.slice(0, 20);
    }

    // Write back to newsData.js
    const outputJsContent = `const newsData = ${JSON.stringify(newsData, null, 2)};\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = newsData;\n}\n`;
    fs.writeFileSync(newsDataPath, outputJsContent, 'utf8');
    console.log(`\nVeritabanı güncellendi! Toplam ${newlyFetchedCount} yeni haber eklendi. Toplam haber: ${newsData.length}`);

    // Update NEWS_VERSION to force localStorage cache refresh!
    const newVersion = `v2_${Date.now()}`;
    const appJsPath = path.join(__dirname, '../js/app.js');
    const adminJsPath = path.join(__dirname, '../js/admin.js');

    if (fs.existsSync(appJsPath)) {
      let appJsContent = fs.readFileSync(appJsPath, 'utf8');
      appJsContent = appJsContent.replace(/const NEWS_VERSION = '.*?';/, `const NEWS_VERSION = '${newVersion}';`);
      fs.writeFileSync(appJsPath, appJsContent, 'utf8');
      console.log(`app.js versiyonu güncellendi: ${newVersion}`);
    }

    if (fs.existsSync(adminJsPath)) {
      let adminJsContent = fs.readFileSync(adminJsPath, 'utf8');
      adminJsContent = adminJsContent.replace(/const NEWS_VERSION = '.*?';/, `const NEWS_VERSION = '${newVersion}';`);
      fs.writeFileSync(adminJsPath, adminJsContent, 'utf8');
      console.log(`admin.js versiyonu güncellendi: ${newVersion}`);
    }

    console.log('--- İşlem Başarıyla Tamamlandı! ---');
  } else {
    console.log('\nYeni bir haber bulunamadı veya tüm haberler zaten veritabanında mevcut.');
    console.log('--- İşlem Sonlandırıldı ---');
  }
}

start();
