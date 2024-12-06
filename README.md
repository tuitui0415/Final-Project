# Steam Game Development Helper

Our project aims to address the significant challenge that game developers face when creating new games, helping them identify game elements that match their goals. 
The tool aims to support developers by analyzing the characteristics that correlate with high ratings, positive feedback, and trends in popularity. Our objective is to reduce uncertainty in the early design phases, allowing developers to make informed decisions about the core elements of their games. Our platform will serve as a valuable resource for spotting emerging trends and uncovering underutilized elements that could contribute to the success of new games.

## Functions
* `Main Chart` Displays a scatter plot dynamically updated based on dataset.
  * `Time Range Slider` Allows selection of a start and end date to filter data within a specific time range.
    * `Start time` Adjust the Start Time slider to set the beginning of the range. 
    * `Start time` Adjust the End Time slider to set the end of the range. The range dynamically adjusts to the start time.
  * `Snapshot` Saves the current state of filtered data for later review.
    * `Y-Axis Lock ` Locks the maximum value of the Y-axis for consistent comparisons across data snapshots. Click the “Unlock Y-Axis” button to unlock the Y-axis.
    * `Clear Snapshots ` Deletes all saved snapshots.
  * `Interactive Legend` Allows filtering data by category through an interactive legend.

* `Game Categories` Displays a scatter plot dynamically updated based on deeper data.
  * `close` Back to the Main Chart
  * `Pie Chart Visualization` Click the circle in the scatter plot to get into this mode. Shows the most reviewd game in specific period and genre as well.
    * `bullets` Use the bullets feature to watch player reviews of the game for inspiration.
      * `Play/Pause Bullets` If you feel that you are disturbing the observation, you can choose to turn off this feature by clicking this button.

## Libraries Installed in this Framework
 * D3.js v7 for visualization
 * [axios](https://axios-http.com/docs/intro) for API.
 * [pinia](https://pinia.vuejs.org/introduction.html) for store management in Vue.js
 * [Vuetify](https://next.vuetifyjs.com/en/components/all/) for UI that follows Google Material Design 3.
 * [lodash](https://lodash.com/) for utility functions in JavaScript.
