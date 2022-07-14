'use strict';

// Constants
const LISTDATA = Object.freeze({
   shows: {
      LoveOfKillS01: {
         name: 'Love of Kill',
         url: 'https://beta.crunchyroll.com/series/G0XHWM0XW/love-of-kill',
         season: '1',
      },
      AriaScarletAmmoS01: {
         name: 'Aria the Scarlet Ammo',
         season: '1',
      },
      RealistHeroRebuiltKingdomS01: {
         name: 'How a Realist Hero Rebuilt the Kingdom',
         url: 'https://beta.crunchyroll.com/series/G1XHJV3MV/how-a-realist-hero-rebuilt-the-kingdom',
         season: '1',
      },
      GodOfHighSchoolS01: {
         name: 'The God of High School',
         url: 'https://beta.crunchyroll.com/series/GRVD0ZDQR/the-god-of-high-school',
         season: '1',
      },
   },
   entries: [
      ['2022-06-21', 'LoveOfKillS01', 1, 2, 3],
      ['2022-06-21', 'AriaScarletAmmoS01', 1, 2, 3],
      ['2022-06-27', 'RealistHeroRebuiltKingdomS01', 1, 2, 3],
      ['2022-07-05', 'GodOfHighSchoolS01', 1, 2, 3],
      ['2022-07-05', 'LoveOfKillS01', 4, 5],
      ['2022-07-13', 'AriaScarletAmmoS01', 4, 5, 6],
      ['2022-07-13', 'LoveOfKillS01', 6],
      ['', 'RealistHeroRebuiltKingdomS01', 4, 5, 6],
      ['', 'GodOfHighSchoolS01', 4, 5, 6],
   ],
});

// Library
function createDOMElement(tag, className, content = null) {
   const html_element = document.createElement(tag);
   if (className) {
      html_element.className = className;
   }
   if (content) {
      if (typeof content === 'string') {
         html_element.innerText = content;
      } else {
         html_element.appendChild(content);
      }
   }
   return html_element;
}

function createDOMHref(href, className, content = null) {
   const html_a = createDOMElement('a', className, content);
   html_a.href = href;
   html_a.target = '_blank';
   return html_a;
}

// Main
class LogEntry {
   constructor(date, show, ...episodes) {
      this.date = date;
      this.show = show;
      this.episodes = episodes;
   }

   formatEpisodes() {
      const episodes = [];
      var rangeStart = null;
      var rangePrev = null;
      this.episodes.forEach((episode) => {
         if (rangeStart === null || rangePrev === null) {
            rangeStart = episode;
            rangePrev = episode;
         } else if (rangePrev + 1 === episode) {
            rangePrev = episode;
         } else if (rangePrev === rangeStart) {
            // TODO
         }
      });
      return this.episodes.join(', ');
   }

   createDOMElement() {
      const html_tr = document.createElement('tr');
      html_tr.appendChild(createDOMElement('td', 'date dateEntry', this.date));
      const html_show = this.show.url ? createDOMHref(this.show.url, 'showHref', this.show.name) : this.show.name;
      html_tr.appendChild(createDOMElement('td', 'showName showNameEntry', html_show));
      html_tr.appendChild(createDOMElement('td', 'showSeason showSeasonEntry', this.show.season));
      html_tr.appendChild(createDOMElement('td', 'episodes episodesEntry', this.formatEpisodes()));
      return html_tr;
   }
}

class PageController {
   constructor() {
      this.reverseList = window.location.hash === '#reverse';
   }

   createDOMReverseListCheckbox() {
      const html_checkbox = document.createElement('input');
      html_checkbox.type = 'checkbox';
      html_checkbox.checked = this.reverseList;
      html_checkbox.addEventListener('click', this.handleToggleReverseList);
      return html_checkbox;
   }

   createDOMReverseListLabel(text = null) {
      const html_label = document.createElement('label');
      html_label.appendChild(this.createDOMReverseListCheckbox());
      if (text) {
         html_label.insertAdjacentText('beforeend', text);
      }
      return html_label;
   }

   createDOMHeadings() {
      const html_tr = document.createElement('tr');
      html_tr.appendChild(createDOMElement('th', 'date dateHeading', this.createDOMReverseListLabel('Date')));
      html_tr.appendChild(createDOMElement('th', 'showName showNameHeading', 'Show'));
      html_tr.appendChild(createDOMElement('th', 'showSeason showSeasonHeading', 'Season'));
      html_tr.appendChild(createDOMElement('th', 'episodes episodesHeading', 'Episodes'));
      return html_tr;
   }

   getLogEntries() {
      const { shows, entries } = LISTDATA;
      const logEntries = entries.map(
         ([timestamp, show, ...episodes]) => new LogEntry(timestamp, shows[show] ?? show, ...episodes),
      );
      if (this.reverseList) {
         logEntries.reverse();
      }
      return logEntries;
   }

   handleToggleReverseList = (event) => {
      this.reverseList = event.target.checked;
      window.location.hash = this.reverseList ? '#reverse' : '#normal';
      this.redraw();
   };

   redraw() {
      const html_root = document.getElementById('root');
      html_root.innerHTML = '';
      const html_table = createDOMElement('table', 'rootTable');
      html_root.appendChild(html_table);
      const html_tbody = createDOMElement('tbody');
      html_table.appendChild(html_tbody);

      html_tbody.appendChild(this.createDOMHeadings());

      this.getLogEntries().forEach((entry) => {
         const html_entry = entry.createDOMElement();
         html_tbody.appendChild(html_entry);
      });
   }
}

// Events
window.addEventListener('load', () => {
   const pageController = new PageController();
   pageController.redraw();
});
