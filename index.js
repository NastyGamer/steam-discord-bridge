#!/usr/bin/env node
'use strict';

const got = require("got");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const chalk = require("chalk");
const { program } = require('commander');

program
  .option('-h, --help', "Shows help message")
  .option('-d, --delay <ms>', "Delay in ms between checks")
  .option('-u, --url <url>', "Url of your public steam-page, i.e. https://steamcommunity.com/id/**username**");
program.parse(process.argv);
const options = program.opts();

if (options.help) {
    console.log("Steam-Discord-Bridge, a tool to show your currently running game in discord when using proton.");
    console.log("Usage: ./sdb [-h] [-d] [-u]")
    process.exit(0)
}
if (!options.delay || !options.url) {
    console.error("Missing parameter(s). See -h for a list of required parameters.");
    process.exit(1)
}

let client = require("discord-rich-presence")("887806370827608094");

const logger = {
    info: (msg) => {
        console.log(`[${chalk.yellowBright("Info")}]${" ".repeat(10)}${msg}`)
    },
    success: (msg) => {
        console.log(`[${chalk.greenBright("Success")}]${" ".repeat(7)}${msg}`)
    },
    error: (msg) => {
        console.log(`[${chalk.redBright("Error")}]${" ".repeat(9)}${msg}`)
    }
}

let playing = undefined

setInterval(() => {
    got(options.url).then(response => {
        logger.info("Fetching HTML from steam-page.")
        const dom = new JSDOM(response.body);
        const div = dom.window.document.querySelector(".profile_in_game_name")
        if (div == null) {
            if(playing == undefined) {
                logger.info("Currently not playing anything. Doing nothing.")
            }
            else {
                client.disconnect()
                playing = undefined
            }
        }
        else {
            if(playing === div.textContent) {
                logger.info(`Still playing ${playing}. Doing nothing.`)
            }
            else {
                logger.success(`Picked up new game ${div.textContent}. Changing presence.`)
                client = require("discord-rich-presence")("887806370827608094");
                client.updatePresence({
                    details: div.textContent,
                    startTimestamp: Date.now(),
                    instance: true
                });
                playing = div.textContent
            }  
        }
        logger.info("Waiting...")
    }).catch(err => {
        logger.error(err)
    });
}, options.delay)