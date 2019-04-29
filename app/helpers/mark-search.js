/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { htmlSafe } from '@ember/string';

import { helper as buildHelper } from '@ember/component/helper';

const MarkSearchHelper = buildHelper((...args) => {
  const [value, search] = Array.from(args[0]);
  if (!search || !value) { return value; }

  return htmlSafe(value.mark_with_tag(search));
});

export default MarkSearchHelper;
