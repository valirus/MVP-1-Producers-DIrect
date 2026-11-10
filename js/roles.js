/*
 * Perfiles de usuario (R1) y público de cada pantalla (R2).
 * El reparto de pantallas por rol es una PROPUESTA del equipo: Producers Direct indicó que
 * la coordinación de ROTA (Eunice) confirmará quién usa cada pantalla. Para ajustarlo,
 * basta con editar ROLES. Ninguna pantalla se oculta: el rol solo cambia el orden del menú.
 * Se carga antes de app.js; la elección se recuerda en este navegador (no guarda datos).
 */
'use strict';

const ROLES = {
  gerencia: {
    label: 'Gerencia de Producers Direct',
    short: 'Gerencia',
    decides: 'dónde enfocar el fondo y cómo caracterizar a las productoras',
    pages: ['summary', 'credit', 'seguimiento', 'production', 'territory']
  },
  campo: {
    label: 'Equipo de campo',
    short: 'Equipo de campo',
    decides: 'a quién visitar y cómo comunicarse con cada productora',
    pages: ['producer', 'seguimiento', 'territory', 'inclusion']
  },
  cooperativa: {
    label: 'Cooperativa',
    short: 'Cooperativa',
    decides: 'cómo están sus socias y qué datos recoger en el próximo ciclo',
    pages: ['summary', 'production', 'producer', 'coverage']
  },
  analisis: {
    label: 'Equipo de análisis',
    short: 'Equipo de análisis',
    decides: 'si la carga es confiable y qué relaciones vale la pena revisar',
    pages: ['quality', 'coverage', 'cross', 'relations']
  }
};

const ROLE_STORAGE_KEY = 'pd-rol';
let currentRole = '';

// Roles para los que cada pantalla es sugerida, en lenguaje sencillo: "Gerencia y Equipo de campo".
function pageAudience(page) {
  const names = Object.values(ROLES).filter((role) => role.pages.includes(page)).map((role) => role.short);
  if (!names.length) return '';
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

function renderPageAudience(page) {
  const el = document.getElementById('page-for');
  if (!el) return;
  const text = pageAudience(page);
  el.hidden = !text;
  el.innerHTML = text ? `<span>Para:</span> ${text}` : '';
}

// Guarda el orden original del menú para poder volver a "Sin perfil".
const navEl = document.querySelector('.nav');
const originalNav = navEl ? [...navEl.children] : [];

function applyRole(role) {
  currentRole = ROLES[role] ? role : '';
  if (navEl) {
    navEl.replaceChildren(...originalNav);
    navEl.querySelectorAll('.nav-group[data-role-group]').forEach((el) => el.remove());
    if (currentRole) {
      const mine = document.createElement('div');
      mine.className = 'nav-group nav-group--mine';
      mine.dataset.roleGroup = 'mine';
      mine.textContent = `Para ti · ${ROLES[currentRole].short}`;
      const others = document.createElement('div');
      others.className = 'nav-group nav-group--others';
      others.dataset.roleGroup = 'others';
      others.textContent = 'Otras secciones';
      const buttons = ROLES[currentRole].pages.map((page) => navEl.querySelector(`button[data-page="${page}"]`)).filter(Boolean);
      navEl.prepend(mine, ...buttons, others);
      // Oculta los títulos de categoría que quedaron sin pantallas debajo.
      navEl.querySelectorAll('.nav-group:not([data-role-group])').forEach((group) => {
        let next = group.nextElementSibling;
        group.hidden = !next || next.classList.contains('nav-group');
      });
    } else {
      navEl.querySelectorAll('.nav-group').forEach((group) => { group.hidden = false; });
    }
  }
  renderRoleBanner();
  try { localStorage.setItem(ROLE_STORAGE_KEY, currentRole); } catch (error) { /* sin almacenamiento: no pasa nada */ }
}

function renderRoleBanner() {
  const banner = document.getElementById('role-banner');
  if (!banner) return;
  if (!currentRole) {
    banner.innerHTML = '<p><strong>¿Quién usa el tablero?</strong> Elige tu perfil en el menú de la izquierda y te mostraremos primero las pantallas que más te sirven.</p>';
    return;
  }
  const role = ROLES[currentRole];
  const first = role.pages.find((page) => page !== 'summary') || role.pages[0];
  banner.innerHTML = `<p>Estás viendo el tablero como <strong>${role.label}</strong>, para decidir ${role.decides}. Te sugerimos empezar por <strong>${pageNames[first]}</strong>.</p>
    <button type="button" class="role-go" data-go="${first}">Ir a ${pageNames[first]}</button>`;
}

document.getElementById('role-banner')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-go]');
  if (button) nav(button.dataset.go);
});

function initRoles() {
  const select = document.getElementById('role-select');
  if (!select) return;
  select.replaceChildren(new Option('Sin perfil (todas en orden)', ''), ...Object.entries(ROLES).map(([key, role]) => new Option(role.label, key)));
  let saved = '';
  try { saved = localStorage.getItem(ROLE_STORAGE_KEY) || ''; } catch (error) { saved = ''; }
  select.value = ROLES[saved] ? saved : '';
  select.addEventListener('change', () => applyRole(select.value));
  applyRole(select.value);
}
