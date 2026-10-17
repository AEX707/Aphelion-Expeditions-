// Shared mobile hamburger menu toggle — used on all public pages.
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('menuToggle');
  const nav = document.querySelector('header nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    nav.classList.toggle('nav-open');
  });
  // close the menu after tapping a link
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('nav-open');
    });
  });
});
