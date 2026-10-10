const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
const submenuToggles = [...document.querySelectorAll('.submenu-toggle')];

function closeSubmenus() {
  submenuToggles.forEach((toggle) => {
    toggle.closest('.has-submenu').classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

function closeMenu() {
  siteNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  closeSubmenus();
}

menuToggle.addEventListener('click', () => {
  const opening = !siteNav.classList.contains('is-open');
  siteNav.classList.toggle('is-open', opening);
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
  if (!opening) closeSubmenus();
});

submenuToggles.forEach((toggle) => toggle.addEventListener('click', () => {
  const parent = toggle.closest('.has-submenu');
  const opening = !parent.classList.contains('is-open');
  closeSubmenus();
  parent.classList.toggle('is-open', opening);
  toggle.setAttribute('aria-expanded', String(opening));
}));

document.querySelectorAll('.has-submenu').forEach((parent) => {
  parent.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse' || window.innerWidth <= 930) return;
    closeSubmenus();
    parent.classList.add('is-open');
    parent.querySelector('.submenu-toggle').setAttribute('aria-expanded', 'true');
  });
  parent.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse' || window.innerWidth <= 930) return;
    parent.classList.remove('is-open');
    parent.querySelector('.submenu-toggle').setAttribute('aria-expanded', 'false');
  });
});

siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 930) closeMenu(); });

const serviceSelect = document.querySelector('#service');
document.querySelectorAll('[data-service]').forEach((link) => link.addEventListener('click', () => {
  serviceSelect.value = link.dataset.service;
}));

document.querySelector('#year').textContent = new Date().getFullYear();

const form = document.querySelector('#service-form');
const status = document.querySelector('#form-status');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const smsConsent = document.querySelector('#sms-consent').checked;
  const body = [
    `Name: ${data.get('name')}`,
    `Phone: ${data.get('phone')}`,
    `Email: ${data.get('email')}`,
    `Service needed: ${data.get('service')}`,
    `SMS contact permission: ${smsConsent ? 'Yes, for service request and appointment updates' : 'No'}`,
    `Request draft prepared: ${new Date().toLocaleString()}`,
    '',
    'Details:',
    data.get('message') || 'No additional details provided.'
  ].join('\n');
  const subject = encodeURIComponent('Service request from Breeze website-2 concept');
  window.location.href = `mailto:breezehc@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  status.textContent = 'Your email app is opening. Please send the prepared message to complete your request. You can also call 615-523-9898.';
  status.hidden = false;
});
