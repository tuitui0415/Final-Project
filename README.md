# Steam Game Development Helper

Our project aims to address the significant challenge that game developers face when creating new games, helping them identify game elements that match their goals. 
The tool aims to support developers by analyzing the characteristics that correlate with high ratings, positive feedback, and trends in popularity. Our objective is to reduce uncertainty in the early design phases, allowing developers to make informed decisions about the core elements of their games. Our platform will serve as a valuable resource for spotting emerging trends and uncovering underutilized elements that could contribute to the success of new games.

## Functions

* `./src/main.ts` is the root script file for Vue.js that instatinates our single page application.
* `./src/App.vue` is the root file for all **development** needs and is also where we manage the layout and load in components.
* `./src/types.ts` is usually where we declare our customized types if you're planning to use it.
* `./src/stores/` is where we manage the stores if you're planning to use it. The store is responsible for global state management.
* `./src/components/` is where we create the components. You may have multiple components depends on your design.
  * `Example.vue` shows how to read `.csv` and `.json`, how component size is being watched, how a bar chart is created, and how the component updates if there are any changes. 
  * `Notes.vue` shows the difference of **state** and **prop**, how to use Vuetify, and how a local state updates based on interaction.
  * `NotesWithStore.vue` is equivalent to `Notes.vue`, excepts it is written in Composition API and uses store.

## Libraries Installed in this Framework
 * D3.js v7 for visualization
 * [axios](https://axios-http.com/docs/intro) for API.
 * [pinia](https://pinia.vuejs.org/introduction.html) for store management in Vue.js
 * [Vuetify](https://next.vuetifyjs.com/en/components/all/) for UI that follows Google Material Design 3.
 * [lodash](https://lodash.com/) for utility functions in JavaScript.
