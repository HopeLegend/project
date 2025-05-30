const LASTFM_KEY = 'e2c5939f6232a96c047626af6f3c9b50';
const BASE_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/';
const DEFAULT_IMAGE = '../public/images/default-music.png';

/**
 * Выполняет запрос к LastFM API с обработкой ошибок
 */
async function apiRequest(endpoint, queryParams = {}) {
  try {
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Получает популярных исполнителей
 */
async function fetchTopArtists(count = 12) {
  try {
    const { artists } = await apiRequest('chart.gettopartists', { limit: count });
    return artists?.artist ?? [];
  } catch {
    return [];
  }
}

/**
 * Получает популярные треки
 */
async function fetchTopTracks(count = 18) {
  try {
    const { tracks } = await apiRequest('chart.gettoptracks', { limit: count });
    return tracks?.track ?? [];
  } catch {
    return [];
  }
}

/**
 * Получает теги для исполнителя
 */
async function fetchArtistTags(artistName, maxTags = 3) {
  if (!artistName) return [];
  
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
 */
async function fetchTrackTags(artistName, trackName, maxTags = 3) {
  if (!artistName || !trackName) return [];
  
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
 * Ограничивает количество параллельных запросов
 */
async function throttleRequests(items, fn) {
  const MAX_PARALLEL = 5;
  const results = [];
  
  for (let i = 0; i < items.length; i += MAX_PARALLEL) {
    const chunk = items.slice(i, i + MAX_PARALLEL);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Отображает блок с популярными исполнителями
 */
async function displayArtistsGrid(artistsData) {
  const container = document.querySelector('.hot-right-now__grid');
  if (!container) return;
  
  // Показываем скелетоны во время загрузки
  container.innerHTML = `
    <div class="artist-card-skeleton">
      <div class="skeleton-image"></div>
      <div class="skeleton-name"></div>
      <div class="skeleton-tags">
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag"></div>
      </div>
    </div>
  `.repeat(12);
  
  if (!artistsData.length) {
    container.innerHTML = `
      <div class="no-results">
        <p>No artists available</p>
      </div>
    `;
    return;
  }

  // Загружаем теги для всех артистов с ограничением
  const artistsWithTags = await throttleRequests(
    artistsData,
    async artist => ({
      ...artist,
      tags: await fetchArtistTags(artist.name)
    })
  );

  // Создаем фрагмент для эффективного добавления
  const fragment = document.createDocumentFragment();
  
  artistsWithTags.forEach(artist => {
    const item = document.createElement('div');
    item.className = 'hot-right-now__item';
    
    const mediaLink = document.createElement('a');
    mediaLink.className = 'hot-right-now__media';
    mediaLink.href = artist.url || '#';
    mediaLink.setAttribute('aria-label', `View ${artist.name}`);
    
    const image = document.createElement('img');
    image.className = 'hot-right-now__thumb';
    image.loading = 'lazy';
    image.src = artist.image?.[2]?.['#text'] || DEFAULT_IMAGE;
    image.alt = `Artist: ${artist.name}`;
    image.width = 120;
    image.height = 120;
    
    const nameElement = document.createElement('p');
    nameElement.className = 'hot-right-now__name';
    nameElement.textContent = artist.name;
    
    mediaLink.append(image, nameElement);
    item.append(mediaLink);
    
    // Добавляем теги если есть
    if (artist.tags.length) {
      const tagsContainer = document.createElement('p');
      tagsContainer.className = 'hot-right-now__tags';
      
      artist.tags.forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.className = 'hot-right-now__tag';
        tagLink.href = tag.url;
        tagLink.textContent = tag.name;
        tagLink.setAttribute('rel', 'noopener noreferrer');
        tagsContainer.append(tagLink);
      });
      
      item.append(tagsContainer);
    }
    
    fragment.append(item);
  });
  
  container.innerHTML = '';
  container.append(fragment);
}

/**
 * Отображает блок с популярными треками
 */
async function displayTracksColumns(tracksData) {
  const mainContainer = document.querySelector('.popular-tracks__columns');
  if (!mainContainer) return;
  
  // Показываем скелетоны во время загрузки
  mainContainer.innerHTML = `
    <div class="popular-tracks__col">
      ${Array(6).fill(`
        <div class="popular-tracks__item">
          <div class="skeleton-image" style="width:60px;height:60px;"></div>
          <div>
            <div class="skeleton-name" style="width:80%;margin-bottom:8px;"></div>
            <div class="skeleton-name" style="width:60%;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `.repeat(3);
  
  if (!tracksData.length) {
    mainContainer.innerHTML = `
      <div class="no-results">
        <p>No tracks available</p>
      </div>
    `;
    return;
  }
  
  // Загружаем теги для всех треков с ограничением
  const tracksWithTags = await throttleRequests(
    tracksData,
    async track => ({
      ...track,
      tags: await fetchTrackTags(track.artist?.name, track.name)
    })
  );

  // Создаем колонки
  mainContainer.innerHTML = '';
  const columns = Array.from({ length: 3 }, () => {
    const col = document.createElement('div');
    col.className = 'popular-tracks__col';
    mainContainer.append(col);
    return col;
  });

  // Распределяем треки по колонкам
  tracksWithTags.forEach((track, index) => {
    const targetColumn = columns[index % 3];
    const trackElement = document.createElement('div');
    trackElement.className = 'popular-tracks__item';
    
    const mediaLink = document.createElement('a');
    mediaLink.className = 'popular-tracks__media';
    mediaLink.href = track.url || '#';
    mediaLink.setAttribute('aria-label', `View track: ${track.name}`);
    
    const image = document.createElement('img');
    image.className = 'popular-tracks__thumb';
    image.loading = 'lazy';
    image.src = track.image?.[2]?.['#text'] || DEFAULT_IMAGE;
    image.alt = `Track: ${track.name}`;
    image.width = 60;
    image.height = 60;
    
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
    artistLink.textContent = track.artist?.name || 'Unknown Artist';
    artistLink.href = track.artist?.url || '#';
    
    infoBlock.append(titleLink, artistLink);
    
    // Добавляем теги если есть
    if (track.tags.length) {
      const tagsWrapper = document.createElement('p');
      tagsWrapper.className = 'popular-tracks__tags';
      
      track.tags.forEach(tag => {
        const tagElement = document.createElement('a');
        tagElement.className = 'popular-tracks__tag';
        tagElement.href = tag.url;
        tagElement.textContent = tag.name;
        tagElement.setAttribute('rel', 'noopener noreferrer');
        tagsWrapper.append(tagElement);
      });
      
      infoBlock.append(tagsWrapper);
    }
    
    trackElement.append(infoBlock);
    targetColumn.append(trackElement);
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
    console.error('Page initialization failed:', error);
    
    // Показываем сообщение об ошибке
    document.querySelectorAll('.hot-right-now__grid, .popular-tracks__columns').forEach(container => {
      container.innerHTML = `
        <div class="error-message">
          <p>Failed to load content. Please try again later.</p>
        </div>
      `;
    });
  }
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', setupPage);