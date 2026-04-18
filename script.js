// ============================================================
// script.js — Донских Недвижимость
// Scroll animations, interactions
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Header scroll effect ----------
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile menu ----------
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Reveal on scroll (IntersectionObserver) ----------
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });
    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ---------- Property cards stagger animation ----------
  const cardGrids = document.querySelectorAll('.properties-grid, .services-grid, .reviews-grid, .blog-grid');
  cardGrids.forEach(grid => {
    const cards = grid.children;
    Array.from(cards).forEach((card, i) => {
      card.classList.add('reveal');
      card.classList.add(`stagger-${Math.min(i + 1, 6)}`);
    });
  });

  // Re-observe newly added reveal elements (for dynamically added cards)
  setTimeout(() => {
    const newReveals = document.querySelectorAll('.reveal:not(.visible)');
    if (newReveals.length > 0) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
      newReveals.forEach(el => obs.observe(el));
    }
  }, 100);

  // ---------- Gallery (object page) ----------
  const gallery = document.querySelector('.object-gallery');
  if (gallery) {
    const images = gallery.querySelectorAll('.gallery-slide');
    const dots = gallery.querySelectorAll('.gallery-dot');
    const prevBtn = gallery.querySelector('.gallery-nav.prev');
    const nextBtn = gallery.querySelector('.gallery-nav.next');
    let current = 0;

    function showSlide(index) {
      images.forEach((img, i) => {
        img.style.display = i === index ? 'block' : 'none';
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      current = index;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
      showSlide((current - 1 + images.length) % images.length);
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      showSlide((current + 1) % images.length);
    });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => showSlide(i));
    });
    if (images.length > 0) showSlide(0);
  }

  // ---------- Catalog filters ----------
  const catalogGrid = document.getElementById('catalog-grid');
  const filterForm = document.getElementById('filter-form');
  const sortSelect = document.getElementById('sort-select');
  const countEl = document.getElementById('catalog-count');

  if (catalogGrid && filterForm) {
    function getFilters() {
      const formData = new FormData(filterForm);
      return {
        type: formData.get('type') || 'all',
        district: formData.get('district') || 'all',
        rooms: formData.get('rooms') || 'all',
        priceMin: formData.get('priceMin') || '',
        priceMax: formData.get('priceMax') || '',
      };
    }

    function renderCatalog() {
      const filters = getFilters();
      const sort = sortSelect ? sortSelect.value : 'date';
      let results = filterProperties(filters);
      results = sortProperties(results, sort);

      if (countEl) {
        const word = pluralize(results.length, ['объект', 'объекта', 'объектов']);
        countEl.textContent = `Найдено ${results.length} ${word}`;
      }

      if (results.length === 0) {
        catalogGrid.innerHTML = `
          <div class="no-results" style="grid-column: 1 / -1;">
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>`;
        return;
      }

      catalogGrid.innerHTML = results.map((p, i) => renderPropertyCard(p, i)).join('');
      // Animate new cards
      setTimeout(() => {
        catalogGrid.querySelectorAll('.reveal:not(.visible)').forEach(el => {
          el.classList.add('visible');
        });
      }, 50);
    }

    filterForm.addEventListener('change', renderCatalog);
    filterForm.addEventListener('input', debounce(renderCatalog, 300));
    if (sortSelect) sortSelect.addEventListener('change', renderCatalog);

    renderCatalog();
  }

  // ---------- Homepage featured properties ----------
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    const featured = properties.slice(0, 3);
    featuredGrid.innerHTML = featured.map((p, i) => renderPropertyCard(p, i)).join('');
  }

  // ---------- Homepage reviews ----------
  const reviewsGrid = document.getElementById('reviews-grid');
  if (reviewsGrid && typeof reviews !== 'undefined') {
    reviewsGrid.innerHTML = reviews.slice(0, 3).map(r => `
      <div class="review-card">
        <p class="review-text">${r.text}</p>
        <div class="review-author">
          <div>
            <div class="review-name">${r.name}</div>
            <div class="review-type">${r.type}</div>
          </div>
          <div class="review-date">${r.date}</div>
        </div>
      </div>
    `).join('');
  }

  // ---------- Homepage blog cards ----------
  const blogGrid = document.getElementById('blog-grid');
  if (blogGrid && typeof blogArticles !== 'undefined') {
    blogGrid.innerHTML = blogArticles.slice(0, 4).map(a => `
      <a href="article.html?id=${a.id}" class="blog-card">
        <div class="blog-card-image">
          <img src="${a.image}" alt="${a.title}" loading="lazy">
        </div>
        <div class="blog-card-body">
          <div class="blog-card-category">${a.category}</div>
          <h3 class="blog-card-title">${a.title}</h3>
          <p class="blog-card-excerpt">${a.excerpt}</p>
          <div class="blog-card-meta">
            <span>${a.dateFormatted}</span>
            <span>${a.readTime}</span>
          </div>
        </div>
      </a>
    `).join('');
  }

  // ---------- Blog listing page ----------
  const blogListingGrid = document.getElementById('blog-listing-grid');
  if (blogListingGrid && typeof blogArticles !== 'undefined') {
    blogListingGrid.innerHTML = blogArticles.map(a => `
      <a href="article.html?id=${a.id}" class="blog-listing-card">
        <div class="blog-card-image">
          <img src="${a.image}" alt="${a.title}" loading="lazy">
        </div>
        <div class="blog-card-body">
          <div class="blog-card-category">${a.category}</div>
          <h3 class="blog-card-title">${a.title}</h3>
          <p class="blog-card-excerpt">${a.excerpt}</p>
          <div class="blog-card-meta">
            <span>${a.dateFormatted}</span>
            <span>${a.readTime}</span>
          </div>
        </div>
      </a>
    `).join('');
  }

  // ---------- Article page ----------
  const articleBody = document.getElementById('article-body');
  const articleTitle = document.getElementById('article-title');
  if (articleBody) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const slug = params.get('slug');
    const article = id ? getArticleById(id) : (slug ? getArticleBySlug(slug) : null);

    if (article) {
      if (articleTitle) articleTitle.textContent = article.title;
      document.title = article.title + ' | Донских Недвижимость';

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.content = article.excerpt;

      const headerEl = document.getElementById('article-header-content');
      if (headerEl) {
        headerEl.innerHTML = `
          <div class="article-meta">
            <span class="article-category">${article.category}</span>
            <span>${article.dateFormatted}</span>
            <span>${article.readTime} чтения</span>
          </div>
          <h1>${article.title}</h1>
        `;
      }

      const coverEl = document.getElementById('article-cover');
      if (coverEl) {
        coverEl.innerHTML = `<img src="${article.image}" alt="${article.title}">`;
      }

      articleBody.innerHTML = article.content + `
        <div class="article-cta">
          <h3>Нужна помощь с недвижимостью?</h3>
          <p>Запишитесь на бесплатную консультацию</p>
          <a href="contact.html" class="btn btn-primary">Записаться на консультацию</a>
        </div>
      `;

      // Update Schema.org
      const schemaEl = document.getElementById('article-schema');
      if (schemaEl) {
        schemaEl.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.title,
          "description": article.excerpt,
          "image": article.image,
          "datePublished": article.date,
          "author": {
            "@type": "Person",
            "name": "Ксения Донских"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Донских Недвижимость"
          }
        });
      }
    } else {
      articleBody.innerHTML = '<div class="no-results"><h3>Статья не найдена</h3><p><a href="blog.html">Вернуться к блогу</a></p></div>';
    }
  }

  // ---------- Object (detail) page ----------
  const objectPage = document.querySelector('.object-page');
  if (objectPage) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const property = getPropertyById(id);

    if (property) {
      document.title = property.title + ' | Донских Недвижимость';

      const titleEl = document.getElementById('object-title');
      const addressEl = document.getElementById('object-address');
      const descEl = document.getElementById('object-description');
      const featuresEl = document.getElementById('object-features');
      const priceEl = document.getElementById('object-price');
      const pricePerEl = document.getElementById('object-price-per');
      const paramsEl = document.getElementById('object-params');
      const galleryEl = document.getElementById('gallery-container');

      if (titleEl) titleEl.textContent = property.title;
      if (addressEl) {
        addressEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${property.districtName}, ${property.address}`;
      }
      if (descEl) descEl.innerHTML = `<h3>Описание</h3><p>${property.description}</p>`;
      if (featuresEl) {
        featuresEl.innerHTML = property.features.map(f => `
          <div class="object-feature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            ${f}
          </div>
        `).join('');
      }
      if (priceEl) priceEl.textContent = formatPrice(property.price);
      if (pricePerEl) pricePerEl.textContent = formatPrice(property.pricePerM) + '/м\u00B2';
      if (paramsEl) {
        paramsEl.innerHTML = `
          <div class="object-param"><div class="object-param-value">${property.area} м\u00B2</div><div class="object-param-label">Площадь</div></div>
          <div class="object-param"><div class="object-param-value">${property.rooms || '\u2014'}</div><div class="object-param-label">${property.rooms ? pluralize(property.rooms, ['комната', 'комнаты', 'комнат']) : 'Свободная план.'}</div></div>
          <div class="object-param"><div class="object-param-value">${property.floor}/${property.floorsTotal}</div><div class="object-param-label">Этаж</div></div>
          <div class="object-param"><div class="object-param-value">${property.year || '\u2014'}</div><div class="object-param-label">Год постройки</div></div>
        `;
      }
      if (galleryEl) {
        galleryEl.innerHTML = property.images.map((img, i) => `
          <img class="gallery-slide" src="${img}" alt="${property.title} - фото ${i + 1}" style="display: ${i === 0 ? 'block' : 'none'}">
        `).join('') + `
          <button class="gallery-nav prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button class="gallery-nav next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          <div class="gallery-dots">${property.images.map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}</div>
        `;

        // Re-init gallery
        const slides = galleryEl.querySelectorAll('.gallery-slide');
        const dots = galleryEl.querySelectorAll('.gallery-dot');
        const prev = galleryEl.querySelector('.gallery-nav.prev');
        const next = galleryEl.querySelector('.gallery-nav.next');
        let cur = 0;

        function show(idx) {
          slides.forEach((s, i) => s.style.display = i === idx ? 'block' : 'none');
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
          cur = idx;
        }

        if (prev) prev.addEventListener('click', () => show((cur - 1 + slides.length) % slides.length));
        if (next) next.addEventListener('click', () => show((cur + 1) % slides.length));
        dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
      }

      // Update schema
      const schemaEl = document.getElementById('object-schema');
      if (schemaEl) {
        schemaEl.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": property.title,
          "description": property.description,
          "image": property.images[0],
          "offers": {
            "@type": "Offer",
            "price": property.price,
            "priceCurrency": "RUB",
            "availability": "https://schema.org/InStock"
          }
        });
      }
    }
  }

  // ---------- Search bar (homepage) ----------
  const searchForm = document.getElementById('hero-search');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(searchForm);
      const params = new URLSearchParams();
      for (const [key, val] of formData.entries()) {
        if (val) params.set(key, val);
      }
      window.location.href = 'catalog.html?' + params.toString();
    });
  }

  // ---------- Back to Top button ----------
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- Mobile CTA bar (show after scrolling past hero) ----------
  const mobileCta = document.getElementById('mobile-cta-bar');
  if (mobileCta) {
    window.addEventListener('scroll', () => {
      mobileCta.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
  }

  // ---------- Phone input mask ----------
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      let val = this.value.replace(/\D/g, '');
      if (val.startsWith('8')) val = '7' + val.slice(1);
      if (val.startsWith('7')) {
        let formatted = '+7';
        if (val.length > 1) formatted += ' (' + val.slice(1, 4);
        if (val.length > 4) formatted += ') ' + val.slice(4, 7);
        if (val.length > 7) formatted += '-' + val.slice(7, 9);
        if (val.length > 9) formatted += '-' + val.slice(9, 11);
        this.value = formatted;
      }
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && this.value.length <= 3) {
        e.preventDefault();
        this.value = '';
      }
    });
    input.addEventListener('focus', function() {
      if (!this.value) this.value = '+7';
    });
    input.addEventListener('blur', function() {
      if (this.value === '+7') this.value = '';
    });
  });

  // ---------- Touch swipe for gallery ----------
  const galleryContainer = document.getElementById('gallery-container');
  if (galleryContainer) {
    let touchStartX = 0;
    let touchEndX = 0;
    galleryContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    galleryContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        const nextBtn = galleryContainer.querySelector('.gallery-nav.next');
        const prevBtn = galleryContainer.querySelector('.gallery-nav.prev');
        if (diff > 0 && nextBtn) nextBtn.click();
        if (diff < 0 && prevBtn) prevBtn.click();
      }
    }, { passive: true });
  }

  // ---------- Homepage services ----------
  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid && typeof services !== 'undefined') {
    const iconMap = {
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
      sell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
      mortgage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
      docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      invest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      relocation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
    };

    servicesGrid.innerHTML = services.map(s => `
      <div class="service-card">
        <div class="service-icon">${iconMap[s.icon] || ''}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <a href="contact.html" class="btn btn-ghost">${s.cta} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      </div>
    `).join('');
  }

});

// ---------- Utility functions ----------
function pluralize(n, forms) {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function renderPropertyCard(p, index) {
  const badgeClass = p.badge ? getBadgeClass(p.badge) : '';
  return `
    <a href="object.html?id=${p.id}" class="property-card reveal stagger-${Math.min((index || 0) + 1, 6)}">
      <div class="property-card-image">
        <img src="${p.images[0]}" alt="${p.title}" loading="lazy" onerror="this.src='images/property-placeholder.svg'">
        ${p.badge ? `<span class="property-badge ${badgeClass}">${p.badge}</span>` : ''}
      </div>
      <div class="property-card-body">
        <h3 class="property-card-title">${p.title}</h3>
        <div class="property-card-address">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.districtName}, ${p.address}
        </div>
        <div class="property-card-meta">
          <span class="property-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            ${p.area}\u00A0м\u00B2
          </span>
          ${p.rooms ? `<span class="property-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            ${p.rooms}\u00A0${pluralize(p.rooms, ['комн.', 'комн.', 'комн.'])}
          </span>` : ''}
          <span class="property-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>
            ${p.floor}/${p.floorsTotal}\u00A0эт.
          </span>
        </div>
        <div class="property-card-footer">
          <div>
            <div class="property-price">${formatPriceShort(p.price)}</div>
            <div class="property-price-per-m">${formatPrice(p.pricePerM)}/м\u00B2</div>
          </div>
          <span class="btn btn-outline-gold">Подробнее</span>
        </div>
      </div>
    </a>
  `;
}

function getBadgeClass(badge) {
  const map = {
    'Premium': 'premium',
    'Инвестиция': 'investment',
    'Новый': 'new',
    'Для семьи': 'family',
    'Хит продаж': 'hit',
    'Первая покупка': 'first',
    'Исторический центр': 'center',
    'Выгодно': 'deal'
  };
  return map[badge] || '';
}
