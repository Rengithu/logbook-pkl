/* ---------------- Dropdown Global Handler ---------------- */
document.addEventListener('click', (e) => {
  const isDropdownBtn = e.target.closest('.dropdown-toggle');
  
  if (isDropdownBtn) {
    const menu = isDropdownBtn.nextElementSibling;
    if (menu && menu.classList.contains('dropdown-menu')) {
      menu.classList.toggle('show');
    }
  }

  // Close all other dropdowns
  $$('.dropdown-menu.show').forEach(menu => {
    if (!isDropdownBtn || isDropdownBtn.nextElementSibling !== menu) {
      menu.classList.remove('show');
    }
  });
});
