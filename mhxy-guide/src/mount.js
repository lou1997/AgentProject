document.addEventListener('DOMContentLoaded', () => {
  const sideNav = document.querySelector('.side-nav');
  if (sideNav) {
    const links = sideNav.querySelectorAll('a');
    const sections = [];
    links.forEach(link => {
      const id = link.getAttribute('href').substring(1);
      const el = document.getElementById(id);
      if (el) sections.push({ id, el, link });
    });

    function onScroll() {
      let current = sections[0]?.id;
      const scrollY = window.scrollY + 120;
      for (const s of sections) {
        if (s.el.offsetTop <= scrollY) current = s.id;
      }
      links.forEach(l => l.classList.remove('active'));
      const activeLink = sideNav.querySelector(`a[href="#${current}"]`);
      if (activeLink) activeLink.classList.add('active');
    }

    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});
