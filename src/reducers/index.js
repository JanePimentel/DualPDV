import { combineReducers } from "redux";
import registerReducer from "./registerReducer";
import configReducer from   "./configReducer";
import userReducer from "./userReducer";
import pdvReducer from "./pdvReducer";
import mainReducer from "./mainReducer";
import salesReducer from "./salesReducer";
import receiveReducer from "./receiveReducer";

export default combineReducers({
registerReducer:registerReducer,
configReducer:configReducer,
userReducer:userReducer,
pdvReducer:pdvReducer,
mainReducer:mainReducer,
salesReducer:salesReducer,
receiveReducer:receiveReducer,

})