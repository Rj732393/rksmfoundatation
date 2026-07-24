// ============================================
//  RAM KINKAR SHAHI MEMORIAL FOUNDATION
//  Reusable Admin Sidebar + Navbar — sidebar.js
//
//  USAGE (on any admin page):
//    1. <link rel="stylesheet" href="sidebar.css"/>
//    2. Placeholder near top of <body>: <div id="fdnSidebarRoot"></div>
//    3. Before other scripts: <script src="sidebar.js"></script>
//    4. Wrap the page's boxes like:
//         <div class="fdn-section" data-section="registration"> ... </div>
//         <div class="fdn-section" data-section="gallery"> ... </div>
//         <div class="fdn-section" data-section="people"> ... </div>
//       (the "people" section should have its heading in an element
//        with id="peopleSectionTitle", and each rendered row should
//        carry a data-category attribute — see admin.js)
//    5. Call initSidebar() once the admin panel is shown (e.g. after login).
// ============================================

const FDN_MENU = [
  {
    id: 'registration',
    icon: '📄',
    label: 'Registration',
    submenu: [
      { filter: '12ab', label: '12AB Registration Certificate' },
      { filter: '80g', label: '80G Registration Certificate' },
      { filter: 'trust', label: 'Trust / Society Registration Certificate' }
    ]
  },
  { id: 'gallery', icon: '📷', label: 'Gallery' }
];

// The three people-type pages: same form/fields, different heading + filter
const FDN_PEOPLE_ITEMS = [
  { category: 'advisory_council', icon: '🧑‍🤝‍🧑', label: 'Advisory Council', heading: '🧑‍🤝‍🧑 Advisory Council' },
  { category: 'volunteer', icon: '🙋', label: 'Volunteers', heading: '🙋 Volunteers' },
  { category: 'brand_ambassador', icon: '🌟', label: 'Brand Ambassadors', heading: '🌟 Brand Ambassadors' }
];

window.fdnCurrentFilter = null;
window.fdnCurrentPeopleCategory = null;

function initSidebar(defaultSection = 'registration') {
  const root = document.getElementById('fdnSidebarRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="fdn-sidebar-overlay" id="fdnSidebarOverlay"></div>

    <nav class="fdn-navbar" id="fdnNavbar">
      <div class="fdn-navbar-left">
        <button class="fdn-navbar-hamburger" id="fdnNavbarHamburger" aria-label="Toggle menu">☰</button>
        <span class="fdn-navbar-title">Ram Kinkar Shahi Memorial Foundation</span>
        <span class="fdn-navbar-crumb" id="fdnNavbarCrumb">Registration</span>
      </div>
      <div class="fdn-navbar-right">
        <button class="fdn-navbar-logout" onclick="if(typeof logout==='function') logout()">Log Out</button>
        <div class="fdn-navbar-badge">FA</div>
      </div>
    </nav>

    <aside class="fdn-sidebar" id="fdnSidebar">
      <div class="fdn-sidebar-brand">
        <span class="fdn-sidebar-brand-dot"></span>
        Foundation Admin
      </div>
      <nav class="fdn-sidebar-nav">
        <ul>
          ${FDN_MENU.map(m => `
            <li>
              <button type="button" class="fdn-item" data-target="${m.id}">
                <span class="fdn-item-icon">${m.icon}</span>
                <span class="fdn-item-label">${m.label}</span>
                ${m.submenu ? '<span class="fdn-chevron">▾</span>' : ''}
              </button>
              ${m.submenu ? `
                <ul class="fdn-submenu" data-parent="${m.id}">
                  ${m.submenu.map(s => `
                    <li><button type="button" class="fdn-subitem" data-target="${m.id}" data-filter="${s.filter}">${s.label}</button></li>
                  `).join('')}
                </ul>` : ''}
            </li>
          `).join('')}
        </ul>
        <div class="fdn-sidebar-group-label">People</div>
        <ul>
          ${FDN_PEOPLE_ITEMS.map(p => `
            <li>
              <button type="button" class="fdn-item" data-target="people" data-category="${p.category}">
                <span class="fdn-item-icon">${p.icon}</span>
                <span class="fdn-item-label">${p.label}</span>
              </button>
            </li>
          `).join('')}
        </ul>
      </nav>
    </aside>
  `;

  document.body.classList.add('fdn-with-sidebar');

  const overlay = document.getElementById('fdnSidebarOverlay');
  const hamburger = document.getElementById('fdnNavbarHamburger');
  const crumb = document.getElementById('fdnNavbarCrumb');

  // Desktop: sidebar open by default. Mobile: closed by default (overlay drawer).
  if (window.innerWidth > 900) {
    document.body.classList.add('fdn-sidebar-open');
  }

  hamburger.addEventListener('click', () => {
    document.body.classList.toggle('fdn-sidebar-open');
  });
  overlay.addEventListener('click', () => {
    document.body.classList.remove('fdn-sidebar-open');
  });

  // On mobile, close the drawer after picking a menu item so the content is visible again.
  const closeOnMobile = () => {
    if (window.innerWidth <= 900) document.body.classList.remove('fdn-sidebar-open');
  };

  root.querySelectorAll('.fdn-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const parentLi = btn.closest('li');
      const hasSubmenu = parentLi.querySelector('.fdn-submenu');

      document.querySelectorAll('.fdn-sidebar-nav li').forEach(li => {
        if (li !== parentLi) li.classList.remove('fdn-expanded');
      });
      if (hasSubmenu) parentLi.classList.toggle('fdn-expanded');

      fdnShowSection(targetId);
      fdnSetActive(btn);
      crumb.textContent = btn.querySelector('.fdn-item-label').textContent;

      if (targetId === 'people' && btn.dataset.category) {
        fdnFilterPeople(btn.dataset.category);
      }
      closeOnMobile();
    });
  });

  root.querySelectorAll('.fdn-subitem').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      fdnShowSection(btn.dataset.target);
      fdnFilterRegistration(btn.dataset.filter);
      fdnSetActive(btn);
      crumb.textContent = btn.textContent;
      closeOnMobile();
    });
  });

  // Open on the default section
  fdnShowSection(defaultSection);
  const defaultBtn = root.querySelector(`.fdn-item[data-target="${defaultSection}"]`);
  if (defaultBtn) {
    defaultBtn.closest('li').classList.add('fdn-expanded');
    fdnSetActive(defaultBtn);
  }
}

function fdnSetActive(btn) {
  document.querySelectorAll('.fdn-item, .fdn-subitem').forEach(el => el.classList.remove('fdn-active'));
  btn.classList.add('fdn-active');
}

function fdnShowSection(sectionId) {
  document.querySelectorAll('.fdn-section').forEach(sec => {
    sec.classList.toggle('fdn-hidden', sec.dataset.section !== sectionId);
  });
  if (sectionId !== 'registration') fdnFilterRegistration(null);
}

// Filters the dynamically-rendered registration cards inside #cardsContainer
// by keyword (12ab / 80g / trust). Call fdnReapplyFilter() after any
// re-render of #cardsContainer so the active filter stays applied.
function fdnFilterRegistration(filterKey) {
  window.fdnCurrentFilter = filterKey;
  const cards = document.querySelectorAll('#cardsContainer .admin-card');
  cards.forEach(card => {
    if (!filterKey) { card.classList.remove('fdn-hidden'); return; }
    const title = (card.querySelector('h2')?.textContent || '').toLowerCase();
    const match =
      (filterKey === '12ab' && title.includes('12ab')) ||
      (filterKey === '80g' && title.includes('80g')) ||
      (filterKey === 'trust' && (title.includes('trust') || title.includes('society')));
    card.classList.toggle('fdn-hidden', !match);
  });
}

function fdnReapplyFilter() {
  if (window.fdnCurrentFilter) fdnFilterRegistration(window.fdnCurrentFilter);
}

// Same form, three headings: filters the People list by category and
// updates the section heading + presets the "Category" dropdown so new
// members are added under the currently open page.
function fdnFilterPeople(category) {
  window.fdnCurrentPeopleCategory = category;

  const item = FDN_PEOPLE_ITEMS.find(p => p.category === category);
  const heading = document.getElementById('peopleSectionTitle');
  if (heading && item) heading.textContent = item.heading;

  const categorySelect = document.getElementById('personCategory');
  if (categorySelect) {
    categorySelect.value = category;
    categorySelect.disabled = true;
  }

  document.querySelectorAll('#peopleAdminList [data-category]').forEach(row => {
    row.classList.toggle('fdn-hidden', row.dataset.category !== category);
  });
}

function fdnReapplyPeopleFilter() {
  if (window.fdnCurrentPeopleCategory) fdnFilterPeople(window.fdnCurrentPeopleCategory);
}

function destroySidebar() {
  const root = document.getElementById('fdnSidebarRoot');
  if (root) root.innerHTML = '';
  document.body.classList.remove('fdn-with-sidebar', 'fdn-sidebar-open');
}
