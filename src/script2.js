const LASTFM_KEY = '6e81a7d82c8ffc507bb2bcfc1f45ddc0';
const API_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Выполняет запрос к LastFM API
 * @param {string} endpoint - Название метода API
 * @param {Object.<string, string|number>} [params={}] - Параметры запроса
 * @returns {Promise.<Object>} Ответ API в JSON
 * @throws {Error} При ошибке HTTP-запроса
 */
async function fetchAPI(endpoint, params = {}) {
  const url = new URL(API_ENDPOINT);
  const query = { method: endpoint, api_key: LASTFM_KEY, format: 'json', ...params };
  
  Object.entries(query)
    .filter(([, val]) => val != null)
    .forEach(([key, val]) => url.searchParams.set(key, val.toString()));

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

/**
 * Ищет исполнителей по запросу
 * @param {string} query - Поисковый запрос
 * @returns {Promise.<Array>} Список найденных исполнителей
 */
const searchArtists = async query => {
  const { results } = await fetchAPI('artist.search', { artist: query, limit: 8 });
  return results?.artistmatches?.artist || [];
};

/**
 * Ищет альбомы по запросу
 * @param {string} query - Поисковый запрос
 * @returns {Promise.<Array>} Список найденных альбомов
 */
const searchAlbums = async query => {
  const { results } = await fetchAPI('album.search', { album: query, limit: 8 });
  return results?.albummatches?.album || [];
};

/**
 * Ищет треки по запросу
 * @param {string} query - Поисковый запрос
 * @returns {Promise.<Array>} Список найденных треков
 */
const searchTracks = async query => {
  const { results } = await fetchAPI('track.search', { track: query, limit: 10 });
  return results?.trackmatches?.track || [];
};

/**
 * Получает дополнительную информацию о треке
 * @param {string} artist - Имя исполнителя
 * @param {string} track - Название трека
 * @param {string} defaultImage - URL изображения по умолчанию
 * @returns {Promise.<Object>} Информация о треке
 */
const getTrackDetails = async (artist, track, defaultImage) => {
  try {
    const { track: info = {} } = await fetchAPI('track.getInfo', { artist, track });
    
    const duration = info.duration ? 
      `${Math.floor(info.duration / 60000)}:${(info.duration % 60000 / 1000).toFixed(0).padStart(2, '0')}` : '';
    
    return {
      duration,
      artistUrl: info.artist?.url || '#',
      imageUrl: info.album?.image?.find(i => i.size === 'medium')?.['#text'] || defaultImage
    };
  } catch {
    return { duration: '', artistUrl: '#', imageUrl: defaultImage };
  }
};

/**
 * Рендерит элементы в указанный контейнер
 * @param {string} selector - CSS-селектор контейнера
 * @param {Array} items - Массив элементов для отображения
 * @param {Function} template - Функция создания элемента
 * @param {string} emptyMessage - Сообщение при отсутствии результатов
 */
const renderContent = (selector, items, template, emptyMessage) => {
  const container = document.querySelector(selector);
  container.innerHTML = items.length ? 
    items.reduce((acc, item) => acc + template(item).outerHTML, '') : 
    `<p class="no-results">${emptyMessage}</p>`;
};

/**
 * Создает карточку исполнителя
 * @param {Object} artist - Объект исполнителя
 * @returns {HTMLElement} Элемент карточки
 */
const createArtistCard = artist => {
  const card = document.createElement('a');
  card.className = 'artist-card';
  card.href = artist.url;
  card.style.backgroundImage = `url(${artist.image?.[2]?.['#text'] || ''})`;

  const info = document.createElement('div');
  info.className = 'artist-info';
  info.innerHTML = `
    <h3 class="artist-name">${artist.name}</h3>
    <p class="artist-listeners">${artist.listeners} listeners</p>
  `;

  card.append(info);
  return card;
};

/**
 * Создает карточку альбома
 * @param {Object} album - Объект альбома
 * @returns {HTMLElement} Элемент карточки
 */
const createAlbumCard = album => {
  const card = document.createElement('a');
  card.className = 'album-card';
  card.href = album.url;
  card.style.backgroundImage = `url(${album.image?.[2]?.['#text'] || ''})`;

  const info = document.createElement('div');
  info.className = 'album-info';
  info.innerHTML = `
    <h3 class="album-title">${album.name}</h3>
    <p class="album-artist">${album.artist}</p>
  `;

  card.append(info);
  return card;
};

/**
 * Отображает список треков
 * @param {Array} tracks - Массив треков
 */
const displayTracks = async tracks => {
  const list = document.querySelector('.track-list');
  list.innerHTML = tracks.length ? '' : '<p class="no-results">No tracks found</p>';

  for (const track of tracks) {
    const initialImage = track.image?.[1]?.['#text'] || 'images/image.png';
    const { duration, artistUrl, imageUrl } = await getTrackDetails(
      track.artist, 
      track.name, 
      initialImage
    );

    const trackItem = document.createElement('li');
    trackItem.className = 'track-item';
    trackItem.innerHTML = `
      <button class="play-btn" aria-label="Play"></button>
      <img class="track-img" src="${imageUrl}" alt="${track.name}">
      <a class="track-title" href="${track.url}">${track.name}</a>
      <a class="track-artist" href="${artistUrl}">${track.artist}</a>
      <span class="track-time">${duration}</span>
    `;

    list.append(trackItem);
  }
};

/**
 * Управляет видимостью секции
 * @param {string} selector - CSS-селектор секции
 * @param {boolean} isVisible - Флаг видимости
 */
const toggleVisibility = (selector, isVisible) => {
  const element = document.querySelector(selector);
  if (element) element.style.display = isVisible ? '' : 'none';
};

/**
 * Инициализирует поисковую страницу
 */
const initializeSearch = async () => {
  const searchQuery = new URLSearchParams(location.search).get('q')?.trim();
  const sections = ['.artists', '.albums', '.tracks', '.search-header'];
  
  if (!searchQuery) {
    sections.forEach(selector => toggleVisibility(selector, false));
    return;
  }

  sections.forEach(selector => toggleVisibility(selector, true));
  document.querySelector('.search-title').textContent = `Results for “${searchQuery}”`;

  try {
    const [artists, albums, tracks] = await Promise.all([
      searchArtists(searchQuery),
      searchAlbums(searchQuery),
      searchTracks(searchQuery)
    ]);

    renderContent('.artist-grid', artists, createArtistCard, 'No artists found');
    renderContent('.album-grid', albums, createAlbumCard, 'No albums found');
    await displayTracks(tracks);

  } catch (error) {
    console.error('Search error:', error);
    document.querySelectorAll('.no-results').forEach(el => el.textContent = 'Loading error');
  }
};

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', initializeSearch);