// ============================================
//  RAM KINKAR SHAHI MEMORIAL FOUNDATION
//  include.js — loads header.html/footer.html
//  into every page (so nav/footer are edited in
//  ONE place), then wires up navbar behavior.
//
//  Every page needs:
//    <div id="site-header"></div>  ...body content...  <div id="site-footer"></div>
//    <script src="include.js"></script>
// ============================================

// The static site (this file, index.html, etc.) is served by Apache shared
// hosting. The counter/API lives on a SEPARATE Node server, deployed
// independently (see server/DEPLOY.md). Point at it explicitly — never
// assume same-origin in production, since they are different hosts.
const API_BASE =
  window.location.hostname === 'localhost' || window.location.port === '5500'
    ? 'http://127.0.0.1:4000'
    : 'https://api.rkshahifoundation.org'; // ← set once the CNAME below is live

async function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    target.innerHTML = await res.text();
  } catch (err) {
    console.error(`Could not load ${url}:`, err);
  }
}

async function initVisitorCounter() {
  const el = document.getElementById('visitorCounter');
  if (!el) return;
  try {
    // credentials: 'include' is required now that the API is on a
    // different subdomain — otherwise the "visited" dedup cookie never
    // gets sent/stored and the count increments on every page load.
    const res = await fetch(`${API_BASE}/counter`, { credentials: 'include' });
    const { count } = await res.json();
    el.textContent = String(count).padStart(7, '0');
  } catch {
    // leave placeholder on failure
  }
}

async function loadSiteChrome() {
  await Promise.all([
    loadPartial('header.html', 'site-header'),
    loadPartial('footer.html', 'site-footer')
  ]);
  initNavbar();
  initFooterCounter();
  initVisitorCounter();
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) mobileMenu.classList.remove('open');
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  // Dropdown (desktop: hover via CSS; also support tap on mobile trigger)
  const trigger = navbar.querySelector('.nav-dropdown-trigger');
  const dropdown = navbar.querySelector('.nav-dropdown');
  if (trigger && dropdown) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }
}

async function initFooterCounter() {
  const el = document.getElementById('footerCounter');
  if (!el || typeof legalApiRequest !== 'function') return;
  try {
    const data = await legalApiRequest('/stats/visit', { method: 'POST' });
    el.textContent = `Visitors: ${data.count.toLocaleString('en-IN')}`;
  } catch (err) {
    el.textContent = '';
  }
}

loadSiteChrome();
