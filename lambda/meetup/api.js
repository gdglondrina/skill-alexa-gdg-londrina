require('dotenv').config();

const axios = require('axios');
const moment = require('moment');

moment.updateLocale('br', {
    relativeTime : {
        future: "em %s",
        past:   "%s atrás",
        s  : 'alguns segundos',
        ss : '%d segundos',
        m:  "um minuto",
        mm: "%d minutos",
        h:  "uma hora",
        hh: "%d horas",
        d:  "um dia",
        dd: "%d dias",
        M:  "um mes",
        MM: "%d meses",
        y:  "um ano",
        yy: "%d ano"
    }
});

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36';
const BASE_API = 'https://api.meetup.com';
const HTML_REGEX = /<[^>]*>?/gm

const GROUP_INFO_ENDPOINT = 'gdg-londrina';
const EVENTS_ENDPOINT = '2/events';

const GROUP_URLNAME_PARAM = 'group_urlname=GDG-Londrina';
const STATUS_UPCOMING_PARAM = 'status=upcoming'

const api = axios.create({
    baseURL: BASE_API,
    responseType: 'json'
});

api.defaults.headers.common["User-Agent"] = USER_AGENT;


/**
 * Recuperar descrição do GDG-Londrina 
 */
async function getGroupDescription() {
    let response = await api.get(`${BASE_API}/${GROUP_INFO_ENDPOINT}?key=${process.env.MEETUP_API_KEY}`);
    let groupDescription = response.data.description;
    if (groupDescription) {
        groupDescription = groupDescription.replace(HTML_REGEX, '');
        groupDescription = groupDescription.split('\n')[0];
    }
    return groupDescription;
}

/**
 * Recuperar próximo Evento GDG-Londrina
 * 
 */
async function getUpcomingEvents() {
    let response = await api.get(`${BASE_API}/${EVENTS_ENDPOINT}?key=${process.env.MEETUP_API_KEY}&${GROUP_URLNAME_PARAM}&${STATUS_UPCOMING_PARAM}`);

    return response.data.results.map(e => {
        return {
            location: {
                address: e.venue.address_1,
                complement: e.how_to_find_us,
                city: e.venue.city,
            },
            maxInvites: e.rsvp_limit,
            maybeCount: e.maybe_rsvp_count,
            yesCount: e.yes_rsvp_count,
            remainingInvites: e.rsvp_limit - e.yes_rsvp_count,
            name: e.name,
            description: e.description.replace('<br/>', '\n').replace(HTML_REGEX, ''),
            urls: {
                eventUrl: e.event_url,
                artThumbUrl: e.photo_url,
                artUrl: e.photo_url.replace('global', 'highres')
            },
            duration: longToDurationString(e.duration),
            when: new Date(e.time)
        }
    });
}

/**
 * Retorna o tempo até o próximo evento do GDG-Londrina
 */
function getTimeUntilAsString(date){
    return moment(date).fromNow()
}

function longToDurationString(longDuration) {
    let durationString = '';
    const duration = moment.duration(longDuration);

    let hours = Math.trunc(duration.asHours());
    if (hours > 0) {
        durationString = ` ${hours} horas`;
    }
    let minutes = duration.minutes();
    if (minutes > 0) {
        durationString += ` e ${minutes} minutos`;
    }
    return durationString;
}

module.exports = {
    getGroupDescription,
    getUpcomingEvents,
    getTimeUntilAsString
}
