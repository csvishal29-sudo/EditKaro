/* script.js — Lightbox + Nav + Contact form handling
   Replace placeholders (VIDEO_ID, file names) with real content.
*/

document.addEventListener('DOMContentLoaded', () => {
  // Utilities
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year in footer
  qs('#year').textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = qs('#nav-toggle');
  const mainNav = qs('.main-nav');
  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.style.display = expanded ? '' : 'flex';
  });

  // LIGHTBOX SYSTEM
  const lightbox = qs('#lightbox');
  const lbBackdrop = qs('#lb-backdrop');
  const lbClose = qs('#lb-close');
  const lbContent = qs('#lb-content');
  const lbPrev = qs('#lb-prev');
  const lbNext = qs('#lb-next');

  // Collect clickable media items (order matters for prev/next)
  const mediaItems = qsa('.video-card, .project');
  const mediaData = mediaItems.map(el => {
    return {
      el,
      type: el.dataset.type || 'video',
      src: el.dataset.src,
      title: el.querySelector('h3')?.textContent || el.querySelector('figcaption h3')?.textContent || ''
    };
  });

  // Open item by index
  let currentIndex = 0;
  function openLightbox(index){
    if(index < 0 || index >= mediaData.length) return;
    currentIndex = index;
    const item = mediaData[index];
    lbContent.innerHTML = createPlayer(item);
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus management
    lbClose.focus();
  }

  function closeLightbox(){
    lightbox.setAttribute('aria-hidden', 'true');
    lbContent.innerHTML = '';
    document.body.style.overflow = '';
  }

  function createPlayer(item){
    // item.type: 'video'|'youtube'|'vimeo'
    if(!item || !item.src) return '<div class="player-error">Video not found</div>';
    if(item.type === 'video'){
      // HTML5 video; controls & preload
      return `<video controls playsinline preload="metadata">
                <source src="${escapeHTML(item.src)}" type="video/mp4">
                Your browser doesn't support embedded video.
              </video>`;
    }
    if(item.type === 'youtube'){
      // Extract id if a full URL provided
      const id = extractYouTubeId(item.src);
      return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${escapeHTML(item.title)}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
    if(item.type === 'vimeo'){
      const id = extractVimeoId(item.src);
      return `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1" title="${escapeHTML(item.title)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    }
    return '<div>Unsupported type</div>';
  }

  function extractYouTubeId(url){
    // Support short and long forms
    try{
      const u = new URL(url);
      if(u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      if(u.searchParams.has('v')) return u.searchParams.get('v');
      // fallback: last path segment
      return u.pathname.split('/').pop();
    }catch(e){
      // fallback if just id passed
      return url;
    }
  }

  function extractVimeoId(url){
    try{
      const u = new URL(url);
      return u.pathname.split('/').pop();
    }catch(e){
      return url;
    }
  }

  function escapeHTML(str){
    if(!str) return '';
    return str.replace(/[&<>"']/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  // Attach click handlers for open
  mediaItems.forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(i));
    el.addEventListener('keypress', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });

  // Lightbox controls
  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => openLightbox((currentIndex - 1 + mediaData.length) % mediaData.length));
  lbNext.addEventListener('click', () => openLightbox((currentIndex + 1) % mediaData.length));
  window.addEventListener('keydown', (e) => {
    if(lightbox.getAttribute('aria-hidden') === 'false') {
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft') lbPrev.click();
      if(e.key === 'ArrowRight') lbNext.click();
    }
  });

  // CONTACT FORM — simple client-side validation + mailto fallback
  const form = qs('#contact-form');
  const formMsg = qs('#form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = qs('#name').value.trim();
    const email = qs('#email').value.trim();
    const project = qs('#project').value.trim();
    const budget = qs('#budget').value;

    if(!name || !email || !project){
      formMsg.textContent = 'Please fill all required fields.';
      return;
    }
    if(!validateEmail(email)){
      formMsg.textContent = 'Please enter a valid email address.';
      return;
    }

    // Normally you'd send to a backend. Here we open mailto as fallback for quick send.
    const subject = encodeURIComponent('Project enquiry from portfolio website');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nBudget: ${budget}\n\nProject details:\n${project}`);
    const mailto = `mailto:alex@novastudio.com?subject=${subject}&body=${body}`;

    // show success UI
    formMsg.style.color = 'var(--accent-2)';
    formMsg.textContent = 'Opening your email client — if it does not open, message copied to clipboard.';
    // copy body to clipboard as fallback
    navigator.clipboard?.writeText(`Subject: Project enquiry\n\n${body.replace(/%0A/g,"\n")}`.replace(/%20/g,' ')).catch(()=>{});
    // open mail client
    window.location.href = mailto;
    form.reset();
  });

  function validateEmail(email){
    // simple regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Accessibility: focus trap basics for lightbox
  lightbox.addEventListener('keydown', (e) => {
    if(e.key !== 'Tab') return;
    const focusable = Array.from(lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled'));
    if(focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  // small enhancement: lazy-loading intersection observer for images (improves perceived performance)
  const lazyImgs = qsa('img[loading="lazy"]');
  if('IntersectionObserver' in window && lazyImgs.length){
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(en => {
        if(en.isIntersecting){
          const img = en.target;
          // If real lazy src provided via data-src, swap. Here we assume src already ok.
          observer.unobserve(img);
        }
      });
    }, {rootMargin:'200px'});
    lazyImgs.forEach(img => obs.observe(img));
  }
});
