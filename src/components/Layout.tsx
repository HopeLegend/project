import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <nav className="header">
        <div className="header__logo">
          <a href="/" className="header__logo-link">Last.fm</a>
        </div>
        <div className="header__wrap">
          <a className="header__search" href="/search"></a>
          <div className="header__nav">
            <ul className="header__nav-list">
              <li className="header__nav-item">
                <a className="header__nav-link">Live</a>
              </li>
              <li className="header__nav-item">
                <a className="header__nav-link">Music</a>
              </li>
              <li className="header__nav-item">
                <a className="header__nav-link">Charts</a>
              </li>
              <li className="header__nav-item">
                <a className="header__nav-link">Events</a>
              </li>
            </ul>
          </div>
          <a className="header__avatar">
            <img className="header__avatar-img" src="images/image.png" loading="eager"  {...{ fetchPriority: 'high' }} />
          </a>
        </div>
      </nav>
      <div className="content">
        <Outlet />
      </div>
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__top">
            <div className="footer__section">
              <h4 className="footer__title">Company</h4>
              <ul className="footer__list">
                <li className="footer__item">About Last.fm</li>
                <li className="footer__item">Contact Us</li>
                <li className="footer__item">Jobs</li>
                <li className="footer__item">Features</li>
              </ul>
            </div>
            <div className="footer__section">
              <h4 className="footer__title">Help</h4>
              <ul className="footer__list">
                <li className="footer__item">Track My Music</li>
                <li className="footer__item">Community Support</li>
                <li className="footer__item">Community Guidelines</li>
                <li className="footer__item">Help</li>
              </ul>
            </div>
            <div className="footer__section">
              <h4 className="footer__title">Goodies</h4>
              <ul className="footer__list">
                <li className="footer__item">Download Scrobbler</li>
                <li className="footer__item">Developer API</li>
                <li className="footer__item">Free Music Downloads</li>
                <li className="footer__item">Merchandise</li>
              </ul>
            </div>
            <div className="footer__section">
              <h4 className="footer__title">Account</h4>
              <ul className="footer__list">
                <li className="footer__item">Inbox</li>
                <li className="footer__item">Settings</li>
                <li className="footer__item">Last.fm Pro</li>
                <li className="footer__item">Logout</li>
              </ul>
            </div>
            <div className="footer__section">
              <h4 className="footer__title">Follow Us</h4>
              <ul className="footer__list">
                <li className="footer__item">Facebook</li>
                <li className="footer__item">Bluesky</li>
                <li className="footer__item">Instagram</li>
                <li className="footer__item">YouTube</li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <div className="footer__info">
              <div className="footer__languages">
                <a className="footer__language footer__language--active">English</a>
                <a className="footer__language">Deutsch</a>
                <a className="footer__language">Español</a>
                <a className="footer__language">Français</a>
                <a className="footer__language">Italiano</a>
                <a className="footer__language">日本語</a>
                <a className="footer__language">Polski</a>
                <a className="footer__language">Português</a>
                <a className="footer__language">Русский</a>
                <a className="footer__language">Svenska</a>
                <a className="footer__language">Türkçe</a>
                <a className="footer__language">简体中文</a>
              </div>
              <div className="footer__timezone">Time zone: Europe/Moscow</div>
              <div className="footer__legal">
                CBS Interactive © 2025 Last.fm Ltd. All rights reserved · Terms of Use · Privacy Policy · Legal Policies · California Notice · Your Privacy Choices · Jobs at Paramount · Last.fm Music
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}