const items = document.querySelectorAll('.item');
items.forEach(i => i.addEventListener('click', () => {
  window.location.href = `./list?source=${i.dataset.source}`;
}));
