document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for nav links
  document.querySelectorAll('.gnav a[href^="/"]').forEach(link => {
    // Just navigation links, handle normally
  });

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
      primary: { bird: 3, mammal: 3, reptile: 1, rare: 1 },
      mid:     { bird: 5, mammal: 5, reptile: 2, rare: 2 },
      high:    { bird: 7, mammal: 7, reptile: 3, rare: 3 },
      master:  { bird: 3, mammal: 15, reptile: 2, rare: 3 }
    };

    function updateLimits() {
      const limits = levelLimits[levelSelect.value];
      animalTypes.forEach(t => {
        countEls[t].max = limits[t];
        if (parseInt(countEls[t].value) > limits[t]) countEls[t].value = limits[t];
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
