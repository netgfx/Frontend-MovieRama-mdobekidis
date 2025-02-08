import { NOW_PLAYING_URL, SEARCH_URL } from "../constants/constants.js";
import {config} from "../helpers/config.js";
/**
 *  Fetches data from the given URL using the given method and parameters
 * @param {*} url 
 * @param {*} method 
 * @param {*} params 
 * @returns 
 */
export const fetcher = async (url, method, params) => {
    // if method is GET, append the params to the URL
    if (method === 'GET') {
        url += '?' + new URLSearchParams(params).toString();
    }
    const response = await fetch(url, {
        method: method,
        headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.API_KEY
        },
        
    });
    
    return response.json();
}

/**
 * Retrieves the list of movies that are currently playing in
 * @returns {Promise<any>}
 */
export const getNowPlaying = async (page) => {
    return await fetcher(NOW_PLAYING_URL, 'GET', {page: page});
}