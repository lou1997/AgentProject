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

  // Calculator (only on ranch page)
  const levelSelect = document.getElementById('ranch-level');
  if (levelSelect) {
    const inputs = {
      bird: document.getElementById('bird-count'),
      mammal: document.getElementById('mammal-count'),
      reptile: document.getElementById('reptile-count'),
      rare: document.getElementById('rare-count')
    };

    const levelLimits = {
      primary: { bird: 3, mammal: 3, reptile: 1, rare: 1 },
      mid: { bird: 5, mammal: 5, reptile: 2, rare: 2 },
      high: { bird: 7, mammal: 7, reptile: 3, rare: 3 },
      master: { bird: 3, mammal: 15, reptile: 2, rare: 3 }
    };

    function updateLimits() {
      const limits = levelLimits[levelSelect.value];
      Object.keys(limits).forEach(key => {
        const input = inputs[key];
        input.max = limits[key];
        if (parseInt(input.value) > limits[key]) input.value = limits[key];
      });
      calculate();
    }

    function calculate() {
      const bird = parseInt(inputs.bird.value) || 0;
      const mammal = parseInt(inputs.mammal.value) || 0;
      const reptile = parseInt(inputs.reptile.value) || 0;
      const rare = parseInt(inputs.rare.value) || 0;

      const totalDaily = bird * 36 + mammal * 48 + reptile * 60 + rare * 60;
      const totalWeekly = totalDaily * 7;

      document.getElementById('daily-score').textContent = Math.round(totalDaily) + ' 分';
      document.getElementById('weekly-score').textContent = Math.round(totalWeekly) + ' 分';
      document.getElementById('weekly-reserve').textContent = Math.floor(totalWeekly / 500) * 10 + ' W';
      document.getElementById('weekly-fruit').textContent = Math.floor(totalWeekly / 4000) + ' 个';
    }

    levelSelect.addEventListener('change', updateLimits);
    Object.values(inputs).forEach(input => input.addEventListener('input', calculate));
    updateLimits();
    calculate();
  }
});
