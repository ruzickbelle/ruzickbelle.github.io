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
      PromisedNeverlandS01: {
         name: 'The Promised Neverland',
         url: 'https://beta.crunchyroll.com/series/GYVD2K1WY/the-promised-neverland',
         url2: 'https://www.netflix.com/title/81145640',
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
      ['2022-07-22', 'RealistHeroRebuiltKingdomS01', 4, 5, 6],
      ['2022-07-22', 'PromisedNeverlandS01', 1, 2, 3],
      ['2022-07-27', 'PromisedNeverlandS01', 4, 5, 6],
   ],
});

// Library
function createDOMElement(tag, className = null, content = null) {
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

function createDOMHref(href, className = null, content = null) {
   const html_a = createDOMElement('a', className, content);
   html_a.href = href;
   html_a.target = '_blank';
   return html_a;
}

function createDOMCheckbox(onClick, checked = false, className = null) {
   const html_checkbox = createDOMElement('input', className);
   html_checkbox.type = 'checkbox';
   html_checkbox.checked = checked;
   html_checkbox.addEventListener('click', onClick);
   return html_checkbox;
}

function createDOMCheckboxLabel(text, onClick, checked = false, labelClassName = null, checkboxClassName = null) {
   const html_checkbox = createDOMCheckbox(onClick, checked, checkboxClassName);
   const html_label = createDOMElement('label', labelClassName, html_checkbox);
   if (text) {
      html_label.insertAdjacentText('beforeend', text);
   }
   return html_label;
}

// Main
class LogEntry {
   static _test() {
      function assert(code, result, expected) {
         if (result === expected) return;
         throw new Error(`assertion failed: ${code} -> '${result}' (expected: '${expected}')`);
      }
      console.log('Testing LogEntry class...');
      assert(
         'new LogEntry(null, null, 1, 3, 5).formatEpisodes()',
         new LogEntry(null, null, 1, 3, 5).formatEpisodes(),
         '1, 3, 5',
      );
      assert(
         'new LogEntry(null, null, 1, 2, 3).formatEpisodes()',
         new LogEntry(null, null, 1, 2, 3).formatEpisodes(),
         '1-3',
      );
      assert(
         'new LogEntry(null, null, 1, 2, 3, 5, 7, 9, 10, 11).formatEpisodes()',
         new LogEntry(null, null, 1, 2, 3, 5, 7, 9, 10, 11).formatEpisodes(),
         '1-3, 5, 7, 9-11',
      );
      assert(
         'new LogEntry(null, null, 1, 2, 4, 5, 7, 8, 10, 12, 13).formatEpisodes()',
         new LogEntry(null, null, 1, 2, 4, 5, 7, 8, 10, 12, 13).formatEpisodes(),
         '1-2, 4-5, 7-8, 10, 12-13',
      );
      assert(
         'new LogEntry(null, null, 1, 101, 201, 202, 301, 401, 402, 403, 501, 601, 602, 603, 604, 701, 702).formatEpisodes()',
         new LogEntry(
            null,
            null,
            1,
            101,
            201,
            202,
            301,
            401,
            402,
            403,
            501,
            601,
            602,
            603,
            604,
            701,
            702,
         ).formatEpisodes(),
         '1, 101, 201-202, 301, 401-403, 501, 601-604, 701-702',
      );
      console.log('LogEntry class test completed.');
   }

   constructor(date, show, ...episodes) {
      this.date = date;
      this.show = show;
      this.episodes = episodes;
   }

   formatEpisodeRange(start, end) {
      return start === end ? `${start}` : `${start}-${end}`;
   }

   formatEpisodes() {
      const episodeRanges = [];
      var start = Number.NaN;
      var prev = Number.NaN;
      this.episodes.forEach((cur) => {
         if (prev + 1 !== cur) {
            if (!Number.isNaN(start)) {
               episodeRanges.push(this.formatEpisodeRange(start, prev));
            }
            start = cur;
         }
         prev = cur;
      });
      if (!Number.isNaN(start)) {
         episodeRanges.push(this.formatEpisodeRange(start, prev));
      }
      return episodeRanges.join(', ');
   }

   createDOMElement() {
      const html_tr = document.createElement('tr');
      html_tr.appendChild(createDOMElement('td', 'date dateEntry', this.date));
      const html_show = this.show.url ? createDOMHref(this.show.url, 'showHref', this.show.name) : this.show.name;
      const html_showName = createDOMElement('td', 'showName showNameEntry', html_show);
      if (this.show.url2) {
         html_showName.innerHTML += '&nbsp;(';
         html_showName.appendChild(createDOMHref(this.show.url2, 'showHref', 'alt'));
         html_showName.appendChild(document.createTextNode(')'));
      }
      html_tr.appendChild(html_showName);
      html_tr.appendChild(createDOMElement('td', 'showSeason showSeasonEntry', this.show.season));
      html_tr.appendChild(createDOMElement('td', 'episodes episodesEntry', this.formatEpisodes()));
      return html_tr;
   }
}

class PageController {
   constructor() {
      this.reverseList = window.location.hash === '#reverse';
   }

   createDOMHeadings() {
      const html_tr = document.createElement('tr');
      const html_date = createDOMCheckboxLabel(
         'Date',
         this.handleToggleReverseList,
         this.reverseList,
         null,
         'reverseListCheckbox',
      );
      html_tr.appendChild(createDOMElement('th', 'date dateHeading', html_date));
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

function _test() {
   LogEntry._test();
}

// Events
window.addEventListener('load', () => {
   const pageController = new PageController();
   pageController.redraw();
});
