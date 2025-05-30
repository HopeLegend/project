import { useEffect, useState } from 'react';
import { fetchPopularArtists, getArtistTags, ArtistData, TagInfo } from '../api/lastfm';

export default function PopularArtists() {
  const [artistList, setArtistList] = useState<ArtistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setIsLoading(true);
        const artists = await fetchPopularArtists();
        setArtistList(artists);
        setError(null);
      } catch (err) {
        setError('Failed to load artists');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtists();
  }, []);

  return (
    <section className="hot-right-now">
      <h2 className="section-title">Trending Artists</h2>
      <div className="title-divider"></div>

      {error && <div className="error-message">{error}</div>}

      <div className="hot-right-now__grid">
        {isLoading ? (
          // Скелетоны при загрузке
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="artist-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-name"></div>
              <div className="skeleton-tags">
                <span className="skeleton-tag"></span>
                <span className="skeleton-tag"></span>
              </div>
            </div>
          ))
        ) : artistList.length > 0 ? (
          // Реальные данные
          artistList.map((artist) => (
            <div key={artist.mbid || artist.name} className="hot-right-now__item">
              <a href={artist.url} className="hot-right-now__media">
                <img
                  className="hot-right-now__thumb"
                  src={artist.image?.[2]?.['#text'] || '/placeholder-artist.jpg'}
                  alt={`${artist.name} profile`}
                  loading="eager"
                  width={120}
                  height={120}
                />
                <h3 className="hot-right-now__name">{artist.name}</h3>
              </a>
              <ArtistTagList artistName={artist.name} />
            </div>
          ))
        ) : (
          // Сообщение при пустых данных
          <div className="no-results">
            <p>No artists found</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ArtistTagList({ artistName }: { artistName: string }) {
  const [tagList, setTagList] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        setIsLoading(true);
        const tags = await getArtistTags(artistName);
        setTagList(tags);
      } catch (err) {
        console.error(`Failed to load tags for ${artistName}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, [artistName]);

  if (isLoading) {
    return (
      <div className="hot-right-now__tags">
        {Array.from({ length: 2 }).map((_, i) => (
          <span key={i} className="skeleton-tag"></span>
        ))}
      </div>
    );
  }

  if (!tagList.length) return null;

  return (
    <div className="hot-right-now__tags">
      {tagList.map((tag) => (
        <a
          key={tag.name}
          href={tag.url}
          className="hot-right-now__tag"
          aria-label={`${tag.name} genre`}
          rel="noopener noreferrer"
        >
          {tag.name}
        </a>
      ))}
    </div>
  );
}