// Конфигурация API
const LASTFM_KEY = 'e2c5939f6232a96c047626af6f3c9b50';
const API_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/';
const DEFAULT_IMAGES = {
  artist: '../public/images/default-artist.jpg',
  album: '../public/images/default-album.jpg',
  track: '../public/images/default-track.png'
};

/**
 * Выполняет запрос к Last.fm API
 * @param {string} method - Метод API
 * @param {Object} params - Параметры запроса
 * @returns {Promise<Object>} Ответ API
 */
async function fetchLastFM(method, params = {}) {
  const url = new URL(API_ENDPOINT);
  const queryParams = new URLSearchParams({
    method,
    api_key: LASTFM_KEY,
    format: 'json',
    ...params
  });

  try {
    const response = await fetch(`${url}?${queryParams}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Форматирует длительность трека (мс → мм:сс)
 * @param {number} duration - Длительность в миллисекундах
 * @returns {string} Отформатированное время
 */
function formatDuration(duration) {
  if (!duration) return '';
  const minutes = Math.floor(duration / 60000);
  const seconds = ((duration % 60000) / 1000).toFixed(0).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * Ищет исполнителей
 * @param {string} query - Поисковый запрос
 * @returns {Promise<Array>} Массив исполнителей
 */
async function searchArtists(query) {
  try {
    const { results } = await fetchLastFM('artist.search', { artist: query, limit: 8 });
    return results?.artistmatches?.artist || [];
  } catch (error) {
    console.error('Artist search failed:', error);
    return [];
  }
}

/**
 * Ищет альбомы
 * @param {string} query - Поисковый запрос
 * @returns {Promise<Array>} Массив альбомов
 */
async function searchAlbums(query) {
  try {
    const { results } = await fetchLastFM('album.search', { album: query, limit: 8 });
    return results?.albummatches?.album || [];
  } catch (error) {
    console.error('Album search failed:', error);
    return [];
  }
}

/**
 * Ищет треки
 * @param {string} query - Поисковый запрос
 * @returns {Promise<Array>} Массив треков
 */
async function searchTracks(query) {
  try {
    const { results } = await fetchLastFM('track.search', { track: query, limit: 10 });
    return results?.trackmatches?.track || [];
  } catch (error) {
    console.error('Track search failed:', error);
    return [];
  }
}

/**
 * Получает детальную информацию о треке
 * @param {string} artist - Имя исполнителя
 * @param {string} track - Название трека
 * @returns {Promise<Object>} Детали трека
 */
async function getTrackDetails(artist, track) {
  try {
    const { track: info = {} } = await fetchLastFM('track.getInfo', { artist, track });
    
    return {
      duration: formatDuration(info.duration),
      artistUrl: info.artist?.url || '#',
      imageUrl: info.album?.image?.find(i => i.size === 'medium')?.['#text'] || DEFAULT_IMAGES.track
    };
  } catch (error) {
    console.error('Failed to get track details:', error);
    return {
      duration: '',
      artistUrl: '#',
      imageUrl: DEFAULT_IMAGES.track
    };
  }
}

/**
 * Создает DOM-элемент карточки исполнителя
 * @param {Object} artist - Данные исполнителя
 * @returns {HTMLElement} Элемент карточки
 */
function createArtistCard(artist) {
  const card = document.createElement('a');
  card.className = 'artists__card';
  card.href = artist.url || '#';
  card.style.backgroundImage = `url(${artist.image?.[2]?.['#text'] || DEFAULT_IMAGES.artist})`;
  card.setAttribute('aria-label', `Artist: ${artist.name}`);

  const info = document.createElement('div');
  info.className = 'artists__info';
  info.innerHTML = `
    <h3 class="artists__name">${artist.name}</h3>
    <p class="artists__listeners">${artist.listeners || 0} listeners</p>
  `;

  card.appendChild(info);
  return card;
}

/**
 * Создает DOM-элемент карточки альбома
 * @param {Object} album - Данные альбома
 * @returns {HTMLElement} Элемент карточки
 */
function createAlbumCard(album) {
  const card = document.createElement('a');
  card.className = 'albums__card';
  card.href = album.url || '#';
  card.style.backgroundImage = `url(${album.image?.[2]?.['#text'] || DEFAULT_IMAGES.album})`;
  card.setAttribute('aria-label', `Album: ${album.name} by ${album.artist}`);

  const info = document.createElement('div');
  info.className = 'albums__info';
  info.innerHTML = `
    <h3 class="albums__name">${album.name}</h3>
    <p class="albums__artist">${album.artist}</p>
  `;

  card.appendChild(info);
  return card;
}

/**
 * Отображает список треков
 * @param {Array} tracks - Массив треков
 */
async function displayTracks(tracks) {
  const listElement = document.querySelector('.tracks__list');
  listElement.innerHTML = '';

  if (!tracks.length) {
    listElement.innerHTML = `
      <div class="no-results">
        <span class="no-results__icon">🎵</span>
        <p>No tracks found</p>
      </div>
    `;
    return;
  }

  for (const [index, track] of tracks.entries()) {
    const { duration, artistUrl, imageUrl } = await getTrackDetails(track.artist, track.name);

    const trackElement = document.createElement('li');
    trackElement.className = 'tracks__item';
    trackElement.innerHTML = `
      <button class="tracks__play-btn" 
              aria-label="Play ${track.name}" 
              data-index="${index}"></button>
      <img class="tracks__image" 
           src="${imageUrl}" 
           alt="${track.name}" 
           loading="lazy">
      <a class="tracks__name" href="${track.url || '#'}">${track.name}</a>
      <a class="tracks__artist" href="${artistUrl}">${track.artist}</a>
      <span class="tracks__duration">${duration}</span>
    `;

    listElement.appendChild(trackElement);
  }

  // Добавляем обработчики событий для кнопок воспроизведения
  document.querySelectorAll('.tracks__play-btn').forEach(btn => {
    btn.addEventListener('click', () => playTrack(tracks[btn.dataset.index]));
  });
}

/**
 * Воспроизводит трек (заглушка для реализации)
 * @param {Object} track - Данные трека
 */
function playTrack(track) {
  console.log('Playing track:', track.name);
  // Здесь должна быть реальная реализация воспроизведения
}

/**
 * Инициализирует поисковую страницу
 */
async function initializeSearch() {
  const searchQuery = new URLSearchParams(window.location.search).get('q')?.trim();
  const searchTitle = document.querySelector('.search-results__title');

  if (!searchQuery) {
    searchTitle.textContent = 'Please enter a search query';
    document.querySelector('.no-results').style.display = 'block';
    return;
  }

  searchTitle.textContent = `Results for "${searchQuery}"`;

  try {
    // Параллельная загрузка всех типов результатов
    const [artists, albums, tracks] = await Promise.all([
      searchArtists(searchQuery),
      searchAlbums(searchQuery),
      searchTracks(searchQuery)
    ]);

    // Отображение результатов
    renderResults('.artists__grid', artists, createArtistCard, 'No artists found');
    renderResults('.albums__grid', albums, createAlbumCard, 'No albums found');
    await displayTracks(tracks);

  } catch (error) {
    console.error('Search initialization failed:', error);
    showErrorState();
  }
}

/**
 * Рендерит результаты в указанный контейнер
 * @param {string} selector - CSS-селектор контейнера
 * @param {Array} items - Массив элементов
 * @param {Function} createElement - Функция создания элемента
 * @param {string} emptyMessage - Сообщение при пустом результате
 */
function renderResults(selector, items, createElement, emptyMessage) {
  const container = document.querySelector(selector);
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = `
      <div class="no-results">
        <span class="no-results__icon">🔍</span>
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    container.appendChild(createElement(item));
  });
}

/**
 * Показывает состояние ошибки
 */
function showErrorState() {
  document.querySelectorAll('.no-results').forEach(el => {
    el.innerHTML = `
      <span class="no-results__icon">⚠️</span>
      <p>Failed to load data. Please try again later.</p>
    `;
    el.style.display = 'block';
  });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  initializeSearch();
  
  // Обработчик для поисковой формы (если есть)
  const searchForm = document.querySelector('.search-results__form');
  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = e.target.querySelector('input').value.trim();
      if (query) {
        window.location.search = `?q=${encodeURIComponent(query)}`;
      }
    });
  }
});