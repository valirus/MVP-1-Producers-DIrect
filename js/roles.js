/* Modos de trabajo: navegación, no autenticación ni control de acceso. */
'use strict';
const ROLES = {
  consulta: { label: 'Consulta del fondo', pages: ['summary', 'production', 'inclusion', 'credit', 'seguimiento', 'producer'] },
  datos: { label: 'Equipo de datos', pages: ['quality', 'coverage'] }
};
let currentRole = 'consulta';
function applyRole(key) {
  currentRole = Object.hasOwn(ROLES, key) ? key : 'consulta';
  document.getElementById('role-select').value = currentRole;
  document.querySelectorAll('.nav [data-page]').forEach(b => { b.hidden = !ROLES[currentRole].pages.includes(b.dataset.page); });
  nav(ROLES[currentRole].pages[0]);
}
function initRoles() {
  const select = document.getElementById('role-select');
  select.replaceChildren(...Object.entries(ROLES).map(([k, role]) => new Option(role.label, k)));
  select.addEventListener('change', () => applyRole(select.value));
  applyRole('consulta');
}
