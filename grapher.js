const CORS_URL = "https://fierce-brushlands-39944.herokuapp.com"
async function parseData([raw, sport]) {
    return new Promise((resolve, _) => {
        let results = $(raw).find('.season').map((_, season) => {
            let seasonEventNames = $(season).find('div.card-block').find('h5').map((_, elem) => $(elem).text())
            let year = season.classList[4].slice(1)
            // If indoor 12014 -> 2014
            yearNum = year.length == 5 ? year.slice(1) : year
            if ($(season).find('div.card-block').length != 1) {
                console.warn('THIS IS NOT GOOD THERE ARE MULTIPLE SECTIONS TO THE SEASON')
            }
            return {
                'year': year.length == 5 ? 'I-' + year.slice(1) : year,
                'events':
                    $(season).find('div.card-block').first().find('table').map((seasonCategoryIndex, seasonCategory) => {
                        return {
                            'event': seasonEventNames[seasonCategoryIndex],
                            'data':
                                $(seasonCategory).find('tr').map((_, event) => {
                                    // Switch time selector based on sport
                                    let timeSelector = sport == 'CrossCountry' ? 'width: 105px;' : 'width:110px;'
                                    // Handle 2 cases: link or no link
                                    let timeElement = $(event).find(`td[style="${timeSelector}"] > a`)[0] ||
                                        $(event).find(`td[style="${timeSelector}"]`)[0]
                                    // Make sure we only take the text, not the 'pr' or 'sr' with it
                                    time = timeElement.childNodes[0].nodeValue.replace('h', '')
                                    // Ignore not starting
                                    if (time == 'DNS') {
                                        return
                                    }

                                    date = $(event).find(`td[style="width: 60px;"]`).text()
                                    // console.log('Time', time)

                                    return { 'time': time, 'date': `${date} ${yearNum}` }
                                })
                        }
                    })
            }
        })
        resolve(results)
    })
}
async function restructureData(parsed) {
    return new Promise((resolve, _) => {
        structure = {}
        for (let i = 0; i < parsed.length; i++) {
            let year = parsed[i].year
            for (let j = 0; j < parsed[i].events.length; j++) {
                let event = parsed[i].events[j].event
                console.log(event)
                if (structure[event] == undefined) {
                    structure[event] = {}
                }
                if (structure[event][year] == undefined) {
                    structure[event][year] = []
                }
                for (let k = 0; k < parsed[i].events[j].data.length; k++) {
                    let result = parsed[i].events[j].data[k]
                    // console.log(result.time)
                    let time = moment(result.time, "mm:ss.S")
                    let date = moment(result.date, "MMM DD YYYY")
                    console.log(time)
                    structure[event][year].push([time, date])
                }
            }
        }
        resolve(structure)
    })
}
function getCORS(url) {
    return $.get(CORS_URL + "/" + url)
}
function postCORS(url, data, callback) {
    console.log(url)
    return $.ajax({
        'type': 'POST',
        'url': CORS_URL + "/" + url,
        'contentType': 'application/json; charset=utf-8',
        'data': JSON.stringify(data),
        'dataType': 'json',
        'success': callback
    });
}