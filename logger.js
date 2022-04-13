module.exports = {
    log: function (text) {
        let d = new Date()
        let date = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`
        console.log(`[${date}] ${text}`)
    },
}
