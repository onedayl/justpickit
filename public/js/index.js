const items = document.querySelectorAll('.item');
items.forEach((item, index) => item.addEventListener('click', () => {
  if (index === 0) {
    window.location.href = `./list?is_free=2&source=1`;

  } else {
    window.location.href = `./list?is_free=3&source=${parseInt(item.dataset.source) + 1}`;

  }
}));
