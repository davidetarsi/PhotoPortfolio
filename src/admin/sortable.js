// Drag & drop minimale per liste verticali. La logica di riordino è pura
// (moveItem); il DOM emette solo (from, to).

export function moveItem(arr, from, to) {
  const copy = [...arr];
  if (from === to || from < 0 || from >= copy.length || to < 0 || to >= copy.length) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function attachSortable(listEl, onMove) {
  let fromIndex = null;
  const indexOf = el => [...listEl.children].indexOf(el.closest('[draggable]'));
  listEl.addEventListener('dragstart', e => { fromIndex = indexOf(e.target); });
  listEl.addEventListener('dragover', e => e.preventDefault());
  listEl.addEventListener('drop', e => {
    e.preventDefault();
    const to = indexOf(e.target);
    if (fromIndex !== null && to !== -1 && to !== fromIndex) onMove(fromIndex, to);
    fromIndex = null;
  });
}
