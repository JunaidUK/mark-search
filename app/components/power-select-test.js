import Component from '@ember/component';
const select_options = ['minority','emotion','easy','push','plot','discriminate',
                        'coffee','dressing','short','tourist']

export default Component.extend({
  didRender(){
    console.log("This component is being rendered")
  },
  select_options,
  actions: {
    loggingInput(){
      console.info("An option was selected")
    }
  }
});
