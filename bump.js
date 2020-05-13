class RunData {
    /**
     * Makes some RunData
     * @constructor
     */
    constructor() {
        this.client = axios.create({baseURL:"https://athletic.net"})
    }
    /**
     * @function Searches athletic.net 
     * @param {string} rawQuery the text
     * @param {Object} options options include type and level.
     */
    search(rawQuery,options=null) {
        const typeLookup = {athlete:"t:a",meet:"t:m","team":"t:t"}
        const levelLookup = {highSchool:"l:4",middleSchool:"l:2",college:"l:8",club:"l:16"}

        const query = encodeURIComponent(rawQuery)
        const space = (options && options.type && options.level) ? " " : ""
        const type = options && options.type ? typeLookup[options.type] : ""
        const level = options && options.level ? levelLookup[options.level]: ""
        const filter = type + space + level
        console.log(`/api/v1/AutoComplete/search?q=${query}&fq=${filter}`)
        return this.client.get(`/api/v1/AutoComplete/search?q=${query}&fq=${filter}`).then(res => res.data.response)
    }
    get(url) {
        let parser = new DOMParser()
        return this.client.get("https://fierce-brushlands-39944.herokuapp.com/https://athletic.net" + url).then(res => parser.parseFromString(res.data, 'text/html'))
    }
    getResultsGrid(schoolID, year, gender) {
        console.log(year)
        const url = `/CrossCountry/Results/Season.aspx?SchoolID=${schoolID}&S=${year}`
        return this.get(url).then(html => {
            return $(html)
        }).then(jqueryDoc => {
            let lookupTable = {}
            jqueryDoc.find(`table.pull-right-sm`).first().find('td').toArray().forEach(td => {
                    lookupTable[td.childNodes[0].textContent] = td.childNodes[1].textContent
            })
            let table = jqueryDoc.find(`div#${gender}_Table`)
            let dates = table.find('tbody').first().find('th').toArray().filter(date => date.className.indexOf("td") > -1).map(date => date.textContent + ` ${year}`)
            for (let i=1;i<dates.length;i++) {
                if (dates[i] == dates[i-1]) { dates[i] = dates[i].concat("(2)") }
            }
            let rawathletes = table.find('tbody.athletes').first().find("tr").toArray().map(athlete => $(athlete).find("td").toArray().map(node => {

                if (node.getElementsByClassName("subscript").length >= 1) {
                    // this is a time node, check for 5k
                    if (lookupTable[node.childNodes[1].textContent] !== "5,000 Meters") { return ' ' }
                        
                }
             return node.textContent
            }))
            let timeSorted = {}
            let athletes = {}
            for (let raw of rawathletes) {
                let obj = {'grade': raw[0],'name': raw[1]}
                let times = raw.slice(2)
                if (times.filter(d => d !== " ").length == 0) { continue }
                for (let i = 1; i < times.length; i++) {
                    if (raw[i - 1 + 2] == " ") { continue }
                    let oldTime = raw[i - 1 + 2]

                    if (raw[i + 2] == " " || (raw[i + 2] in lookupTable)) { raw[i + 2] = oldTime } // overwrite a null time to a previous one
                    if (moment(oldTime, "mm:ss.SS").isBefore(moment(raw[i+2], "mm:ss.SS"))) { raw[i + 2] = oldTime}
                    //if (raw[i + 2] == " ") { raw[i + 2] = raw[i - 1 + 2] } // overwrite a null time to a previous one
                }
                raw.slice(2).forEach((t,i) => { // All of the athletes times
                    let res = Object.assign({date: dates[i], time: t==" "?null:t, actualTime: (i==0) ? true : (raw.slice(2)[i-1]==t) ? false : true}, obj)
                    if (!(dates[i] in timeSorted)) {
                        timeSorted[dates[i]] = []
                    }
                    timeSorted[dates[i]].push(res)
                })
            }
            for (let t in timeSorted) {
                
                timeSorted[t].sort(function(a,b) {
                    if (a.time===null) { return 1 }
                    if (b.time===null) { return -1 }
                    return moment(a.time, "mm:ss.S").isBefore(moment(b.time, "mm:ss.S")) ? -1 : 1;
                })
                timeSorted[t] = timeSorted[t].slice(0, 10) // We now need to add seasonEndNodes for each athletes
                // Now add the rankings
                for (var i = 0; i < timeSorted[t].length;i++) {
                    timeSorted[t][i].rank = i+1
                }
            }
            // Now add the seasonEndNode
            let flattened = Object.values(timeSorted).flatMap(d => d)
            let uniqueNames = [...new Set(flattened.map(d => d.name))]
            let toDelete = []
            for (let athlete of uniqueNames) {
                let times = flattened.filter(d => d.name == athlete)
                //console.log(times)
                let lastTime = times.slice().reverse().filter(d => d.time !== null)[0] // the index of the last time
                if (lastTime == undefined) { // remove this athlete, they have no valid times after cutoff
                    toDelete.push(athlete)
                    continue
                }
                timeSorted[lastTime.date] = timeSorted[lastTime.date].map(d => {
                    if  (d.name == athlete) {
                        d.seasonEndNode = true
                    }
                    return d
                })
            }
            for (let name of toDelete) {
                for (let date of Object.keys(timeSorted)) {
                    for (let i=0;i<timeSorted[date].length;i++) {
                        if (timeSorted[date][i].name == name) {
                            console.log('deleted', name)
                            timeSorted[date].splice(i)
                            //i-=1
                        }
                    }
                }
            }

            return timeSorted
        })
    }
}