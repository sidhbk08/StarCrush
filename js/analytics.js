import Analytics from './google-analytics.js';

// Fire a page view event on load
window.addEventListener('load', () => {
  Analytics.firePageViewEvent(document.title, document.location.href);
});

document.addEventListener('restart', () => {
    if(document.title.indexOf('Restart') < 0) {
      document.title += ' - Restart';
      document.location.href += '#restart';
    }
    Analytics.firePageViewEvent(document.title, document.location.href);
});
