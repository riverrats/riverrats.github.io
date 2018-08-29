$('a.preset-id').click(function() {
		console.log("running v1")
		displaySchool($(this).data('schoolid'))
});

$('button.custom-id').click(function() {
	displaySchool($('.custom-id-value').val())
});

$(document).on("click", ".athlete", function() {
	console.log("clicked");
	displayAthlete($(this).data('athleteid'), $(this).data('athletename'))
});
function displayAthlete(id, name) {
	var url = `https://www.athletic.net/CrossCountry/Athlete.aspx?AID=${id}#!/L0`
	fetch("https://allorigins.me/get?url=" + url).then(function(response) {
        return response.json()
    }).then((data) => {
		times = extractTimes(data["contents"])
		console.log(times)
		data = prepTimes(times)
		graphTimes(data, name	)
	})
	console.log(id, name);
}

function prepTimes(times) {

	preppedTimes = []
	var colorSelector = 0;
	var colors = ["#7ad3c0", "#61a3ce", "#b283c6", "#c45850"]
	for (var key in times['times']) {
		var renamedKeys = []
		for (race in times['times'][key]) {
			currentRace = times['times'][key][race]
			renamedKeys.push({"x":currentRace["date"], "y":currentRace["time"].valueOf()})
		}
		preppedTimes.push(
			{
				data: renamedKeys,
				label: key,
				lineTension: 0,
				borderColor: colors[colorSelector],
				fill: false,
				pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
				pointBackgroundColor: colors[colorSelector]

			}
		)
		colorSelector += 1
	}
	prepped = times
	prepped["times"] = preppedTimes
	console.log(prepped)
	return prepped
}
function graphTimes(times, name) {
	var ctx = $('.timeGraph')
	console.log(times['fastest'])
	console.log(times['slowest'])
	console.log(times['step'])
	var chart = new Chart(ctx, {
    	type: 'line',
    	data: {
        	datasets: times['times']
    	},
	    options: {
			scales: {
				xAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Date'
					},
					type: 'time',
					time: {
						displayFormats: {
								week: 'MMM DD'
						}
					}


				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: '5k Time'
					},
					type: 'linear',
					position: 'left',
					ticks: {
						min: times['fastest'],
						max: times['slowest'],
						stepSize: times['step'],
						callback: (rawTime) => {
							time = moment(rawTime)
							return time.format('mm:ss.S')
						}
					}
				}]
			},
			title: {
				display: true,
				text: name
			},
			hover: {
				mode: "nearest"
			},
			tooltips: {
  				callbacks: {
					title: function(tooltip, data) {
						year = data.datasets[tooltip[0].datasetIndex].label
						return moment(tooltip[0].xLabel).format('MMM DD ') + year
					},
					label: function(tooltip, data) {
						time = moment(tooltip.yLabel).format('mm:ss.S')
						return time
					}
  				}
			}
		}
	});
}
function extractTimes(source) {
	parser = new DOMParser();
	htmlDoc = parser.parseFromString(source, "text/html")
	tags = htmlDoc.getElementsByClassName("season")
	var data = {"times":{}, "fastest":1e10, "slowest":0};
	var numItems = 0;
	for (let tag of tags) {
		headerTags = tag.getElementsByTagName("h5")
		if (headerTags[1].textContent != "5,000 Meters") {
			continue
		}
		year = tag.classList[4].slice(1)
		races = tag.querySelectorAll("tr")
		if (typeof data["times"][year] === 'undefined') {
			data["times"][year] = []
		}
		for (let race of races) {
			date = race.querySelector('td[style="width: 60px;"]').textContent
			time = race.querySelector('td[style="width: 105px;"] > a').firstChild.textContent
			var [min, sec, milli] = time.split(/\:|\./)
			data["times"][year].push({"date":new Date(date + " 2000"),"time":new Date(1970, 1, 1, 0, min, sec, milli * 100)})
			numItems += 1
		}
		data["times"][year].sort(function(a, b) {
			return a["date"] - b["date"]
		})
		yearFastest = Math.min.apply(Math, data["times"][year].map(function(o) { return o["time"].valueOf(); }))
		yearSlowest = Math.max.apply(Math, data["times"][year].map(function(o) { return o["time"].valueOf(); }))
		if(yearFastest < data["fastest"]) {
			data["fastest"] = Number(yearFastest.toPrecision(7)) - 5000
		}
		if (yearSlowest > data["slowest"]) {
			data["slowest"] = Number(yearSlowest.toPrecision(7)) + 5000
		}
	}
	data["step"] = 15000
	console.log("slowest:", data["slowest"])
	return data
}
function displaySchool(id) {
	var url = `https://www.athletic.net/CrossCountry/School.aspx?SchoolID=${id}`
	fetch("https://allorigins.me/get?url=" + url).then(function(response) {
        return response.json()
    }).then((data) => {
		var [teamData, tokenData] = extractJson(data["contents"])
		var female = "<li style='text-align:center'>Female</li>"
		var male = "<li style='text-align:center'>Male</li>";
		teamData["athletes"].forEach(function(athlete) {
			link = `<li><a class="athlete" href="#" data-athletename="${athlete["Name"]}" data-athleteid=${athlete["ID"]}>${athlete["Name"]}</a></li>\n`

			if (athlete["Gender"] == "F") {
				female += link
			} else {
				male += link
			}
		})
		$("ul.female").html(female)
		$("ul.male").html(male)
		//addScript(tokenData["embedToken"], id)
    })
}
function addScript(tokenID, teamID) {
	var scriptTag = `<script src="https://www.athletic.net/api/1/RemoteHTML.ashx?Report=XCCalendar1&Style=2SchoolID=${teamID}&Season=2018&t=${tokenID}" type="text/javascript"></script>`
	postscribe($("main"), scriptTag)
}
function extractJson(source) {
	var rawTeamData = /constant\("initialData", (.+)\);/.exec(source);
	var rawTokenData = /constant\("params", (.+)\)/.exec(source);
	return [JSON.parse(rawTeamData[1]), JSON.parse(rawTokenData[1])]
}
