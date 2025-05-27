const LASTFM_KEY = '6e81a7d82c8ffc507bb2bcfc1f45ddc0';
const BASE_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Выполняет запрос к LastFM API.
 * @param {string} endpoint - Название метода API
 * @param {Object.<string, string|number>} [queryParams={}] - Параметры запроса
 * @returns {Promise.<Object>} Ответ API в JSON
 * @throws {Error} При ошибке HTTP-запроса
 */
async function apiRequest(endpoint, queryParams = {}) {
  const requestUrl = new URL(BASE_ENDPOINT);
  const parameters = {
    method: endpoint,
    api_key: LASTFM_KEY,
    format: 'json',
    ...queryParams
  };
  
  Object.entries(parameters)
    .filter(([, val]) => val !== undefined)
    .forEach(([key, val]) => requestUrl.searchParams.set(key, val.toString()));

  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

/**
 * Получает популярных исполнителей
 * @param {number} [count=12] Количество элементов
 * @returns {Promise.<Array>} Список исполнителей
 */
async function fetchTopArtists(count = 12) {
  const { artists } = await apiRequest('chart.gettopartists', { limit: count });
  return artists?.artist ?? [];
}

/**
 * Получает популярные треки
 * @param {number} [count=18] Количество элементов
 * @returns {Promise.<Array>} Список треков
 */
async function fetchTopTracks(count = 18) {
  const { tracks } = await apiRequest('chart.gettoptracks', { limit: count });
  return tracks?.track ?? [];
}

/**
 * Получает теги для исполнителя
 * @param {string} artistName - Имя исполнителя
 * @param {number} [maxTags=3] Макс. тегов
 * @returns {Promise.<Array>} Список тегов
 */
async function fetchArtistTags(artistName, maxTags = 3) {
  try {
    const { toptags } = await apiRequest('artist.gettoptags', { artist: artistName });
    return (toptags?.tag || [])
      .filter(t => t.url)
      .slice(0, maxTags);
  } catch {
    return [];
  }
}

/**
 * Получает теги для трека
 * @param {string} artistName - Имя исполнителя
 * @param {string} trackName - Название трека
 * @param {number} [maxTags=3] Макс. тегов
 * @returns {Promise.<Array>} Список тегов
 */
async function fetchTrackTags(artistName, trackName, maxTags = 3) {
  try {
    const { toptags } = await apiRequest('track.gettoptags', {
      artist: artistName,
      track: trackName
    });
    return (toptags?.tag || [])
      .filter(t => t.url)
      .slice(0, maxTags);
  } catch {
    return [];
  }
}

/**
 * Отображает блок с популярными исполнителями
 * @param {Array} artistsData - Данные исполнителей
 */
async function displayArtistsGrid(artistsData) {
  const container = document.querySelector('.hot-right-now__grid');
  container.innerHTML = '';
  
  artistsData.forEach(artist => {
    const element = document.createElement('div');
    element.className = 'hot-right-now__item';
    
    const mediaLink = document.createElement('a');
    mediaLink.className = 'hot-right-now__media';
    mediaLink.href = artist.url || '#';
    
    const image = new Image();
    image.className = 'hot-right-now__thumb';
    image.loading = 'eager';
    image.width = 120;
    image.height = 120;
    image.src = artist.image?.[2]?.['#text'] || '';
    image.alt = artist.name;
    
    const nameElement = document.createElement('p');
    nameElement.className = 'hot-right-now__name';
    nameElement.textContent = artist.name;
    
    mediaLink.append(image, nameElement);
    element.append(mediaLink);
    container.append(element);

    fetchArtistTags(artist.name).then(tags => {
      if (!tags.length) return;
      
      const tagsContainer = document.createElement('p');
      tagsContainer.className = 'hot-right-now__tags';
      
      tags.forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.className = 'hot-right-now__tag';
        tagLink.href = tag.url;
        tagLink.textContent = tag.name;
        tagsContainer.append(tagLink);
      });
      
      element.append(tagsContainer);
    });
  });
}

/**
 * Отображает блок с популярными треками
 * @param {Array} tracksData - Данные треков
 */
async function displayTracksColumns(tracksData) {
  const mainContainer = document.querySelector('.popular-tracks__columns');
  mainContainer.innerHTML = '';
  
  const columns = Array.from({ length: 3 }, () => {
    const col = document.createElement('div');
    col.className = 'popular-tracks__col';
    mainContainer.append(col);
    return col;
  });

  tracksData.forEach((track, index) => {
    const targetColumn = columns[index % 3];
    const trackElement = document.createElement('div');
    trackElement.className = 'popular-tracks__item';
    
    const mediaLink = document.createElement('a');
    mediaLink.className = 'popular-tracks__media';
    mediaLink.href = track.url || '#';
    
    const image = new Image();
    image.className = 'popular-tracks__thumb';
    image.loading = 'lazy';
    image.src = track.image?.[2]?.['#text'] || '';
    image.alt = track.name;
    
    mediaLink.append(image);
    trackElement.append(mediaLink);
    
    const infoBlock = document.createElement('div');
    infoBlock.className = 'popular-tracks__info';
    
    const titleLink = document.createElement('a');
    titleLink.className = 'popular-tracks__track';
    titleLink.textContent = track.name;
    titleLink.href = track.url || '#';
    
    const artistLink = document.createElement('a');
    artistLink.className = 'popular-tracks__artist';
    artistLink.textContent = track.artist?.name || '';
    artistLink.href = track.artist?.url || '#';
    
    infoBlock.append(titleLink, artistLink);
    trackElement.append(infoBlock);
    targetColumn.append(trackElement);
    
    fetchTrackTags(track.artist?.name, track.name).then(tags => {
      if (!tags.length) return;
      
      const tagsWrapper = document.createElement('p');
      tagsWrapper.className = 'popular-tracks__tags';
      
      tags.forEach(tag => {
        const tagElement = document.createElement('a');
        tagElement.className = 'popular-tracks__tag';
        tagElement.href = tag.url;
        tagElement.textContent = tag.name;
        tagsWrapper.append(tagElement);
      });
      
      infoBlock.append(tagsWrapper);
    });
  });
}

/**
 * Инициализирует главную страницу
 */
async function setupPage() {
  try {
    const [artists, tracks] = await Promise.all([
      fetchTopArtists(),
      fetchTopTracks()
    ]);
    
    await displayArtistsGrid(artists);
    await displayTracksColumns(tracks);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', setupPage);