import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserRouter as Router} from "react-router-dom";
import Moment from "moment-timezone";

// Set the default timezone to UTC
Moment.locale("en");
Moment.tz.setDefault("UTC");
//IMPORTANT: This is required BEFORE "App" component is imported

import {GovernanceApp} from "geekfactory_governance_frontend";
import "./index.less"

console.log("process.env.FRONTEND_CANISTER", process.env.FRONTEND_CANISTER);
console.log("process.env.GOVERNANCE_CANISTER_ID", process.env.GOVERNANCE_CANISTER_ID);
ReactDOM.render(<Router>
    <GovernanceApp governanceCanisterId={process.env.GOVERNANCE_CANISTER_ID} currentAssetCanisterId={process.env.FRONTEND_CANISTER}/>
</Router>, document.getElementById('root'))
