// TODO: Re-assess whether extending native String is either necessary or desirable:
/* eslint no-extend-native: ["error", { "exceptions": ["String"] }] */
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/string';

import { escapeExpression } from '../utils/ember-deprecated';

const initialize = function(app) {
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
      const subjectString = this.toString();
      if ((position === undefined) || (position > subjectString.length)) {
        position = subjectString.length;
      }
      position -= searchString.length;
      const lastIndex = subjectString.indexOf(searchString, position);
      return (lastIndex !== -1) && (lastIndex === position);
    };
  }

  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      if (!position) { position = 0; }
      return this.lastIndexOf(searchString, position) === position;
    };
  }

  // escape all chars that are otherwise interpreted by regexp parser
  // This ensures, e.g., that '?' is interpreted a literal, and not 'match any char'
  String.prototype.escape_for_regexp = function() {
    return this.replace(/([\\.+*?[^\]$(){}=!<>|:])/g, '\\$1');
  };

  String.prototype.mark_with_tag = function(substring, tag) {
    // First, mark off the found substrings with invisible characters.
    // Then escape the string to ensure we don't execute user-entered HTML
    // Then, replace the invisible chars with the <mark> tag.

    // we will be using these invisible characters temporarily in the string,
    // so make sure we don't have any to start with
    if (tag == null) { tag = 'mark'; }
    // eslint-disable-next-line no-control-regex
    let cleanString = this.replace(/[\x01\x02]/g, '');
    cleanString = cleanString.replace(new RegExp(`(${substring.escape_for_regexp()})`, 'gi'), '\x01$1\x02');
    cleanString = escapeExpression(cleanString);
    // eslint-disable-next-line no-control-regex
    return cleanString.replace(/\x01/g, `<${tag}>`).replace(/\x02/g, `</${tag}>`);
  };

  // returns the string with all non-digits removed, e.g. "1 (334) 67-88" => "13346788"
  String.prototype.digitsOnly = function() {
    return this.replace(/\D/g, '');
  };

  // given a single-char string, is it a digit?
  if (!String.prototype.isDigit) {
    String.prototype.isDigit = function() {
      // apparently a space is a number according to JavaScript.
      // comparing "@ is ' '" doesn't work reliably in poltergeist, so use charCodeAt. Bizzare.
      // TODO: consider replacing with Number.isNaN:
      return !((this.charCodeAt(0) === 32) || window.isNaN(this));
    };
  }

  const domainRegexp = /^((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // my attempts to interpolate domainRegexp into emailRegexp were spectacularly unsuccessful.
  const emailRegexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  String.prototype.isValidEmail = function() {
    return this.match(emailRegexp);
  };

  String.prototype.isValidDomain = function() {
    return this.match(domainRegexp);
  };

  String.prototype.isValidPhoneNumber = function() {
    const matchRes = this.match(/\d/g);
    return (matchRes != null) && (matchRes.length > 9) && (matchRes.length < 16);
  };

  String.prototype.to_email_domain = function() {
    if (!this.isValidEmail()) { return ''; }
    return this.split('@').pop();
  };

  // TODO consider making iOS behave like #parameterize instead of like #to_domain
  String.prototype.parameterize = function() {
    return this.replace(/[^a-z0-9]+/gi, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').toLowerCase();
  };

  String.prototype.to_portfolio = function() {
    // letters, numbers, and literal dashes remain, everything else is eliminated
    return this.replace(/[^a-z0-9-]+/gi, '').toLowerCase();
  };

  String.prototype.to_domain = function() {
    // leading and trailing dashes are eliminated
    return this.to_portfolio().replace(/^-+|-+$/g, '').toLowerCase();
  };

  String.prototype.ensureScheme = function() {
    if (this.startsWith('http://') || this.startsWith('https://')) {
      return this;
    }
    return `http://${this}`;
  };

  String.prototype.caseInsensitiveCompare = function(other) {
    return this.toLowerCase().localeCompare(other.toLowerCase());
  };

  const linkRegexpStr = '(https?://)?([a-z0-9-]+\\.)+[a-z]{2,4}(:[0-9]+)?(/[a-z0-9_/\\.-]*)?(\\?[a-z0-9_&=%-]*)?';
  const linkRegexp = new RegExp(`${linkRegexpStr}(?=\\W|$)`, 'gi');
  const anchoredLinkRegexp = new RegExp(`^${linkRegexpStr}$`, 'gi');

  // locate url-like substrings in the string and turn them into links
  String.prototype.insertLinks = function() {
    const text = escapeExpression(this);
    const linkText = text.replace(linkRegexp, s => `<a href='${s.ensureScheme()}' target='new'>${s}</a>`);
    return htmlSafe(linkText);
  };

  String.prototype.isLink = function() {
    return this.match(anchoredLinkRegexp);
  };

  String.prototype.addThousandsSeparator = function(separator) {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  };

  String.prototype.removeNewLine = function() {
    return this.replace(/(\r\n|\n|\r)/gm, ' ');
  };

  String.prototype.getFileExtension = function() {
    return this.slice(this.lastIndexOf('.'));
  };

  String.prototype.getFilenameWithoutExtension = function() {
    return this.slice(0, this.lastIndexOf('.'));
  };

  return String.prototype.asFloorName = function() {
    // eslint-disable-next-line no-underscore-dangle
    const i18n = app.__container__.lookup('service:i18n');
    const floorKeywords = i18n.t('floor.floorKeywords').string.split(' ');
    if (isEmpty(this) || floorKeywords.any(keyword => this.toLowerCase().includes(keyword))) {
      return this;
    }
    return `${i18n.t('floor.floorPrefix')} ${this}`;
  };
};


const StringInitializer = {
  name: 'string-initializer',
  initialize
};

export { initialize };
export default StringInitializer;
