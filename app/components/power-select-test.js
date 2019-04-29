import Component from '@ember/component';
const select_options = ['minority','emotion','easy','push','plot','discriminate',
                        'coffee','dressing','short','tourist']

export default Component.extend({
  select_options,
  actions: {
    loggingInput(){console.log("An option was selected")},
  }
});
