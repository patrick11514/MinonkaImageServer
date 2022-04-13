const clc = require('cli-color')

module.exports = {
    log: function (text) {
        let date = this.getDate()

        text = ' '.repeat(13 - date.length) + text
        console.log(clc.red(`[${date}]`) + clc.white(text))
    },
    debug: function (text) {
        let date = this.getDate()

        text = ' '.repeat(13 - date.length) + text
        console.log(clc.blue(`[${date}]`) + clc.white(text))
    },
    getDate: function () {
        let d = new Date()
        let hours = d.getHours() > 9 ? d.getHours() : '0' + d.getHours()
        let minutes = d.getMinutes() > 9 ? d.getMinutes() : '0' + d.getMinutes()
        let seconds = d.getSeconds() > 9 ? d.getSeconds() : '0' + d.getSeconds()
        let date = `${hours}:${minutes}:${seconds}:${d.getMilliseconds()}`
        return date
    },
}
