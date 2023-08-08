import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserRouter as Router} from "react-router-dom";
import Moment from "moment-timezone";

// Set the default timezone to UTC
Moment.locale("en");
Moment.tz.setDefault("UTC");
//IMPORTANT: This is required BEFORE "App" component is imported

// import {AppConfig} from "src/components/sys/config/AppConfig";
// AppConfig.init()

import {App} from "src/components/App";

ReactDOM.render(<Router>
    <App/>
</Router>, document.getElementById('root'))
