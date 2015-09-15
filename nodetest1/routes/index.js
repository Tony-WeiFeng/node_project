var express = require('express');
var router = express.Router();
//var jiraClient = require('jira-connector');
var querystring = require('querystring');
//var url = require('url');
var https = require('https');
//var https = require('https');
//var util = require('util');

var request=require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TONY' });
});


/* GET Userlist page. */
// router.get('/userlist', function(req, res, next) {
// 	var db = req.db;
// 	var collection = db.get('usercollection');
// 	collection.find({},{},function(e,docs) {
// 		res.render('userlist', {
// 			"userlist" : docs
// 		});
// 	});
// });

/* GET New User page. */
// router.get('/newuser', function(req, res) {
//     res.render('newuser', { title: 'Add New User' });
// });

/* GET Jira Search page. */
router.get('/search', function(req, res, next) {
    res.render('search', { title: 'Jira Search',jiraList:[]});
});

/* POST to Add User Service */
router.post('/query', function(req, jiraResponse, next) {

    // Get our form values. These rely on the "name" attributes
    var projectName = req.body.project;
    var strKeywords = req.body.keywords;

    // Split the keywords
    var keywordsList = strKeywords.split(" ");

    var jqlStr = 'project = ' + projectName + ' AND issuetype = Fix AND text ~ "' + strKeywords + '" ORDER BY createdDate DESC';
    //var jqlStr = 'reporter = currentUser() ORDER BY createdDate DESC';
    var postData = {
        jql: jqlStr,
        startAt: 0,
        //maxResults: 100,
        validateQuery: true,
        fields: ['key','summary','description','status']
    };

    var opt = {
        host: 'jira.bbpd.io',
        path: '/rest/api/2/search',
        method: 'POST',
        json: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGZlbmc6NDRBMmQzc2szcg=='
        }
    };


    var req = https.request(opt,function(res){
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);

        var body = '';

        //console.log("body: ", res);
        res.on('data', function(chunk) {
            body += chunk;
            //process.stdout.write(JSON.parse(chunk));
            //process.stdout.write(chunk);

        });

        res.on('end',function(){
            var json = JSON.parse(body);
            //process.stdout.write(JSON.parse(body));
            //process.stdout.write(json);
            //console.log('============cut line=========');
            //console.log(json);
            console.log(json.issues[0].fields.status.name);
            //console.log(json.issues[0].fields.summary);

            var jiraList = matchSearch(json,keywordsList);
            jiraResponse.render('search', { title: 'Jira Search', jiraList: jiraList });
        });
    });

    req.write(JSON.stringify(postData));
    //console.log("result: ", str);

    req.end();



    req.on('error', function(e){
        console.error('ERROR: ' + e.message);
    });
 });

// jiraResults is json object for search date set
function matchSearch (jiraResults,keyWordsList){

    var jiraItemList = jiraResults.issues;
    var matchRateList = [];

    //for (var i=0; i<jiraIteamList.length; i++){
    //    for (var j=0; j<keyWordsList.length; j++) {
    //
    //    }
    //}

    jiraItemList.forEach(function(jiraTicket, jiraTicketIndex){

        var matchRate = 0;

        keyWordsList.forEach(function(keyword,keyWordIndex){

            // Get keyword fequency in summary and description
            var fequencyInSummary = jiraTicket.fields.summary.split(keyword).length - 1;
            var fequencyInDescription = jiraTicket.fields.description.split(keyword).length - 1;

            matchRate = matchRate + fequencyInSummary * 70 + fequencyInDescription * 30;
        })

        matchRateList[jiraTicketIndex] = [jiraTicketIndex, matchRate];
    });
    // Re-order the rate list according rate by decrease order.
    matchRateList = matchRateList.sort(function(x,y){
        return y[1] - x[1]; // Decrease order
    });

    var sortedJiraItemList = [];

    // Get top 10 match rate jira tickets
    var j = matchRateList.length > 10 ? 10 : matchRateList.length;
    for (var i =0; i < j; i++) {
        // Get jira iteam list indexes for top 10 match rate
        var jiraIteamListIndex = matchRateList[i][0];
        sortedJiraItemList[i] = jiraItemList[jiraIteamListIndex];
    }

    return sortedJiraItemList;
}

module.exports = router;