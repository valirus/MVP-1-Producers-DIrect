/*
 * Filtros encadenados.
 * Un filtro solo ofrece valores que existen dentro de los demás filtros activos.
 * Sin estado global: recibe filas y devuelve opciones + selección normalizada.
 */
(function (root) {
  'use strict';

  const ALL = 'all';
  const NULL = '__null__';
  const GEO = ['coop', 'territory', 'base'];

  const match = (value, choice) =>
    choice === ALL || choice === undefined || choice === null ||
    (choice === NULL ? value == null : value === choice);

  function rowsFor(rows, filters, ignore) {
    return rows.filter((row) =>
      GEO.every((key) => key === ignore || match(row[key], filters[key] ?? ALL))
    );
  }

  function valuesFor(rows, key) {
    const values = [...new Set(rows.map((row) => row[key]))];
    const hasNull = values.some((value) => value == null);
    const sorted = values
      .filter((value) => value != null)
      .sort((a, b) => String(a).localeCompare(String(b), 'es'));
    return hasNull ? [...sorted, NULL] : sorted;
  }

  function normalize(rows, filters) {
    const next = {
      coop: filters.coop ?? ALL,
      territory: filters.territory ?? ALL,
      base: filters.base ?? ALL,
      producer: filters.producer ?? ''
    };

    // Dos pasadas bastan para resolver dependencias entre los tres filtros.
    for (let pass = 0; pass < 2; pass += 1) {
      let changed = false;
      for (const key of GEO) {
        const allowed = valuesFor(rowsFor(rows, next, key), key);
        if (next[key] !== ALL && !allowed.includes(next[key])) {
          next[key] = ALL;
          changed = true;
        }
      }
      if (next.producer !== '') {
        const index = Number(next.producer);
        const row = rows[index];
        if (!row || !rowsFor(rows, next).includes(row)) {
          next.producer = '';
          changed = true;
        }
      }
      if (!changed) break;
    }

    return next;
  }

  function cascade(rows, filters) {
    const normalized = normalize(rows, filters);
    const options = {};
    for (const key of GEO) {
      options[key] = valuesFor(rowsFor(rows, normalized, key), key);
    }
    options.producer = rowsFor(rows, normalized).map((row) => ({
      value: String(rows.indexOf(row)),
      code: row.code,
      coop: row.coop
    }));
    return { filters: normalized, options };
  }

  function filterRows(rows, filters) {
    return rowsFor(rows, normalize(rows, filters), null);
  }

  const api = { ALL, NULL, GEO, match, valuesFor, normalize, cascade, filterRows, rowsFor };
  root.PDFilters = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
