/* ---------------- Mobile Responsiveness & Sidebar Toggle ---------------- */
const btnMobileMenu = document.getElementById('btnMobileMenu');
const sidebar = document.querySelector('.app-sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

function toggleMobileSidebar() {
  sidebar.classList.toggle('open');
  mobileOverlay.classList.toggle('show');
  
  if (sidebar.classList.contains('open')) {
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  } else {
    document.body.style.overflow = '';
  }
}

function closeMobileSidebar() {
  sidebar.classList.remove('open');
  mobileOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

if (btnMobileMenu && sidebar && mobileOverlay) {
  btnMobileMenu.addEventListener('click', toggleMobileSidebar);
  mobileOverlay.addEventListener('click', closeMobileSidebar);
  
  // Close sidebar when clicking a navigation link on mobile
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      }
    });
  });
}
