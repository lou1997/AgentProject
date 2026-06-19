document.addEventListener('DOMContentLoaded', () => {
  // Sidebar scroll-spy
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

  // Animal type tabs
  const animalTabs = document.querySelectorAll('.animal-tab');
  const animalGrids = document.querySelectorAll('.animal-grid');
  animalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      animalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.type;
      animalGrids.forEach(grid => grid.classList.remove('active'));
      const target = document.getElementById('type-' + type);
      if (target) target.classList.add('active');
    });
  });

  // Calculator
  const levelSelect = document.getElementById('ranch-level');
  if (levelSelect) {
    const animalTypes = ['bird','mammal','reptile','rare'];
    const typeSelectEls = {};
    const countEls = {};
    animalTypes.forEach(t => {
      typeSelectEls[t] = document.getElementById(t + '-type');
      countEls[t] = document.getElementById(t + '-count');
    });

    const allInputs = [...Object.values(typeSelectEls), ...Object.values(countEls)];

    const levelLimits = {
      primary:    { bird: 3, mammal: 3, reptile: 1, rare: 1 },
      mid:        { bird: 5, mammal: 5, reptile: 2, rare: 2 },
      high:       { bird: 7, mammal: 7, reptile: 3, rare: 6 },
      beast:      { bird: 4, mammal: 15, reptile: 1, rare: 3 },
      reptile_spec: { bird: 4, mammal: 3, reptile: 13, rare: 3 },
      bird_spec:  { bird: 16, mammal: 3, reptile: 1, rare: 3 },
      rare_spec:  { bird: 4, mammal: 3, reptile: 1, rare: 15 }
    };

    function updateLimits() {
      const limits = levelLimits[levelSelect.value];
      animalTypes.forEach(t => {
        countEls[t].max = limits[t];
        countEls[t].value = limits[t];
      });
      calculate();
    }

    function calculate() {
      let totalDaily = 0;
      animalTypes.forEach(t => {
        const count = parseInt(countEls[t].value) || 0;
        const sel = typeSelectEls[t];
        const daily = parseFloat(sel.options[sel.selectedIndex].dataset.score) || 0;
        totalDaily += count * daily;
      });

      const totalWeekly = totalDaily * 7;
      document.getElementById('daily-score').textContent = Math.round(totalDaily) + ' 分';
      document.getElementById('weekly-score').textContent = Math.round(totalWeekly) + ' 分';
      document.getElementById('weekly-reserve').textContent = Math.floor(totalWeekly / 500) * 10 + ' W';
      document.getElementById('weekly-fruit').textContent = Math.floor(totalWeekly / 4000) + ' 个';
    }

    levelSelect.addEventListener('change', updateLimits);
    allInputs.forEach(el => el.addEventListener('input', calculate));
    allInputs.forEach(el => el.addEventListener('change', calculate));
    updateLimits();
  }
});
