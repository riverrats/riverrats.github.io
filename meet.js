
$('#submit').click(function() {
  // https://gist.github.com/6174/6062387
	var randMeetName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  var radioValue = $("input[name='gender']:checked").val();
  var meetID = $("input#meetID").val();
  console.log(meetID);
  console.log(radioValue);
  
  console.log(randMeetName);
});

function postData(url, callbackParam) {
    var params = { 
    "__CALLBACKPARAM":"NONE",
    "__CALLBACKID": "__Page",
    "__VIEWSTATEGENERATOR": "", 
    "__VIEWSTATE": "", 
    "__EVENTARGUMENT":"",
    "__EVENTTARGET":""
  }
  params["__CALLBACKPARAM"] = callbackParam
  $.post(url, params, function(data, status) {
    console.log(data);
  })
}
function extractJson(source) {
	var rawTeamData = /constant\("initialData", (.+)\);/.exec(source);
	var rawTokenData = /constant\("params", (.+)\)/.exec(source);
	return [JSON.parse(rawTeamData[1]), JSON.parse(rawTokenData[1])]
}
function getMeetTeams(meetID, modeLetter) {
  var mode = "CrossCountry";
  if modeLetter == "T" {
    mode = "TrackAndField";
  }
var url = `https://www.athletic.net/${mode}/meet/${meetID}/teams`;
  console.log(url);
	fetch("https://allorigins.me/get?url=" + url).then(function(response) {
        return response.json();
    }).then((data) => {
		  var [teamData, _] = extractJson(data["contents"]);
		  console.log(teamData["teams"]);
  }
}
