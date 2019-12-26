#!/usr/bin/env node

const chalk = require('chalk')
const boxen = require('boxen')
const axios = require('axios')
const yargs = require('yargs')
const cheerio = require('cheerio')
const colors = require('colors')

const headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
}

const options = yargs.usage("Usage: -n <name>").option("n", {
    alias: 'name',
    describe: 'name or alias of site',
    type: 'string'
}).option('q', {
    alias: 'query',
    describe: 'query',
    type: 'string',
    demand: true
}).argv

const magic = {
    "credentials": "omit",
    "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
    },
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": null,
    "method": "GET",
    "mode": "cors"
}

function duck_search(q) {
    axios.get(`https://duckduckgo.com/html/?q=${q}`, magic).then(res => {
        const data = res.data
        $ = cheerio.load(data)
        $('h2.result__title a').each(function(index, value) {
            let i = $(this)
            let url = decodeURL($(this).attr('href').split('uddg=')[1])
            console.log(`${i.text().trim()} | ` + url.green)
        })
    }).catch(e => {
        console.log(e)
    })
}

function decodeURL(url) {
    return url.replace(/%2D/g, '-').replace(/%2F/g, '/').replace(/%3A/g, ':')
}

const siteHandlers = {
    'stackoverflow.com': (q) => {
        axios.get(q, magic).then(res => {
            const $ = cheerio.load(res.data)
            const title = $('#question-header h1').text().trim()
            console.log(`${title}:`.bold)
            let postData = []
            $('.post-layout .votecell').each(function(i, value) {
                if (!postData[i]) {
                    postData[i] = {}
                }
                postData[i].votes = $(this).text().trim()
            })
            $('.post-layout .post-layout--right .post-text').each(function(i, value) {
                postData[i].text = $(this).text().trim().replace(/\n\s*\n/g, '\n')
            })
            postData.forEach(data => {
                console.log(`[${data.votes.cyan}] ${data.text}\n`)
            })
        }).catch(e => {
            console.log(e)
        })
    },
    'en.wikipedia.org': (q) => {
        axios.get(q, magic).then(res => {
            const $ = cheerio.load(res.data)
            console.log($.text())
            $('.references').remove()
            $('.div-col.columns.column-width').remove()
            $('div[role=navigation]').each(function() {
                $(this).remove()
            })
            let title = $('#firstHeading').text().trim()
            console.log(`${title}:`.bold)
            console.log(`${$('#mw-content-text .mw-parser-output').text().trim()}`)
        }).catch(e => {
            console.log(e)
        })
    }
}

const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue"
};

let query = options.query
if (query.slice(0, 4) == 'http') {
    let site = query.split('/')[2]
    if (site in siteHandlers) {
        console.log(`loading ${query.green}.....`)
        siteHandlers[site](query)
    } else {
        console.log(`there is no handler for ${site.green}`)
    }
} else {
    const greeting = chalk.white.bold(`Your query is ${options.query}!`);
    const msgBox = boxen(greeting, boxenOptions);
    console.log(msgBox);
    duck_search(options.query)
}
