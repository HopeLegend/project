import { useEffect, useState } from 'react';
import { fetchPopularArtists, getArtistTags, ArtistData, TagInfo } from '../api/lastfm';

export default function PopularArtists() {
  const [artistList, setArtistList] = useState<ArtistData[]>([]);

  useEffect(() => {
    fetchPopularArtists().then(setArtistList).catch(console.error);
  }, []);

  return (
    <section className="popular-section">
      <h2 className="section-heading">Trending Artists</h2>
      <div className="section-divider"></div>
      
      <div className="artist-grid">
        {artistList.map((artist) => (
          <article key={artist.mbid || artist.name} className="artist-card">
            <a href={artist.url} className="artist-link">
              <img
                className="artist-image"
                src={artist.image?.[2]?.['#text'] || '/placeholder-artist.jpg'}
                alt={`${artist.name} profile`}
                loading="eager"
                width={120}
                height={120}
              />
              <h3 className="artist-name">{artist.name}</h3>
            </a>
            <ArtistTagList artistName={artist.name} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ArtistTagList({ artistName }: { artistName: string }) {
  const [tagList, setTagList] = useState<TagInfo[]>([]);

  useEffect(() => {
    getArtistTags(artistName).then(setTagList).catch(() => {});
  }, [artistName]);

  if (!tagList.length) return null;

  return (
    <div className="tag-container">
      {tagList.map((tag) => (
        <a
          key={tag.name}
          href={tag.url}
          className="genre-tag"
          aria-label={`${tag.name} genre`}
        >
          {tag.name}
        </a>
      ))}
    </div>
  );
}