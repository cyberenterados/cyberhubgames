(() => {
  'use strict';

  const searchInput = document.getElementById('catalog-search');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const cards = Array.from(document.querySelectorAll('.catalog-card'));
  const gamesSection = document.getElementById('games-section');
  const toolsSection = document.getElementById('tools-section');
  const gamesCount = document.getElementById('games-count');
  const toolsCount = document.getElementById('tools-count');
  const catalogCount = document.getElementById('catalog-count');
  const emptyState = document.getElementById('empty-state');

  if (!searchInput || !gamesSection || !toolsSection || !gamesCount || !toolsCount || !catalogCount || !emptyState) {
    return;
  }

  let activeFilter = 'all';

  const normalizeText = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

  const refreshCatalog = () => {
    const query = normalizeText(searchInput.value.trim());
    let visibleGames = 0;
    let visibleTools = 0;

    cards.forEach((card) => {
      const matchesQuery = normalizeText(`${card.dataset.search || ''} ${card.textContent}`).includes(query);
      const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
      const isVisible = matchesQuery && matchesFilter;
      card.hidden = !isVisible;

      if (isVisible && card.dataset.category === 'game') visibleGames += 1;
      if (isVisible && card.dataset.category === 'tool') visibleTools += 1;
    });

    gamesSection.hidden = activeFilter === 'tool' || visibleGames === 0;
    toolsSection.hidden = activeFilter === 'game' || visibleTools === 0;
    gamesCount.textContent = `${visibleGames} DISPONIBLES`;
    toolsCount.textContent = `${visibleTools} DISPONIBLES`;

    const visibleTotal = visibleGames + visibleTools;
    catalogCount.textContent = `${visibleTotal} de ${cards.length} ejecutables`;
    emptyState.hidden = visibleTotal > 0;
  };

  searchInput.addEventListener('input', refreshCatalog);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || 'all';
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      refreshCatalog();
    });
  });

  refreshCatalog();
})();
