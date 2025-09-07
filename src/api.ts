import axios from "axios";
import {WG_SERVER, WG_SERVER_LOGIN, WG_SERVER_PASSWORD} from "src/app.constants";

export const wgApi = axios.create({
    baseURL: `${WG_SERVER}/api`,
    auth: {username: WG_SERVER_LOGIN, password: WG_SERVER_PASSWORD},
})
