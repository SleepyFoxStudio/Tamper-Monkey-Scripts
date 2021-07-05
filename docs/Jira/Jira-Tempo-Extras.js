// ==UserScript==
// @name         AC-Internal-Addons
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*/jira/secure/Tempo.jspa*
// @icon         https://www.google.com/s2/favicons?domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log('Running AC-Internal-Addons');

    var isIssueCardPage = false;
    var isReportPage = false;


    window.onload = function () {
        var loopCount = 0;

        var checkExist = setInterval(function () {
            loopCount++;
            if (loopCount > 15) {

                console.log('Gave up waiting');
                clearInterval(checkExist);
            }
            if (document.getElementsByName("tempoCardIssueKey") != null ||
                document.getElementsByName("tempo-report-container") != null) {
                console.log("Exists!");
                if (window.location.hash.indexOf('#/my-work/timesheet') == 0) {
                    console.log('Identified page as work week report for user');
                    isReportPage = true;
                    updateAllIssueKeys();
                }
                if (window.location.hash.indexOf('#/my-work/week') == 0) {
                    console.log('Identified page as personal work week');
                    isIssueCardPage = true;
                    updateAllCards();
                }

                clearInterval(checkExist);
            }
        }, 1000); // check every 100ms
    };



    function updateAllIssueKeys() {
        var els = document.getElementsByClassName("tempo-reports-key")
        console.log("tempo items" + els.length);
        for (var i = 0; i < els.length; i++) {
            console.log(`Going to update item${i}`);
            var element = els[i];
            var issueKey = element.innerHTML;
            console.log(`Getting days logged for ${issueKey}`);
            getIssueDetails(issueKey, element);
        }
    }

    function updateAllCards() {
        var els = document.getElementsByName("tempoCardIssueKey")
        console.log("tempo cards" + els);
        for (var i = 0; i < els.length; i++) {
            console.log(`Going to update card${i}`);
            var element = els[i];
            var issueKey = element.getElementsByTagName('a')[0].innerHTML;
            console.log(`Getting days logged for ${issueKey}`);
            getIssueDetails(issueKey, element);
        }
    }





    function updateReportItemsithValue(element, daysLogged) {
        console.log("updating report item field");
        var issueKeyLink = element;


        var el = document.createElement("span");
        var daysRemainingText = `${daysLogged.toFixed(2)} days left`
        el.title = daysRemainingText;
        el.innerHTML = daysRemainingText;
        el.style = "font.size:6px;margin-left:5px;"
        insertAfter(issueKeyLink, el);
    }

    function updateCardWithValue(element, daysLogged) {
        console.log("updating tempo card");
        var issueKeyLink = element.getElementsByTagName('a')[0];


        var el = document.createElement("span");
        var daysRemainingText = `${daysLogged.toFixed(2)} days left`
        el.title = daysRemainingText;
        el.innerHTML = daysRemainingText;
        el.style = "font.size:6px;margin-left:5px;"
        insertAfter(issueKeyLink, el);
    }

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }



    function getIssueDetails(issueKey, element) {
        var url = "/jira/rest/api/2/search/";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                console.log(xhr.status);
                var myResponse = JSON.parse(xhr.responseText);
                var daysPurchased = myResponse.issues[0].fields.customfield_13105;
                var created = new Date(Date.parse(myResponse.issues[0].fields.created));

                console.log(`${issueKey} days purchased : ${daysPurchased}, created: ${created}`);

                if (daysPurchased == null) {
                    console.log(`${issueKey} daysPurchased is null, so returning`);
                    return;
                }
                updateDaysRemaining(issueKey,daysPurchased,created, element);

            }
        };

        var data = `{"jql": "issueKey in ('${issueKey}')","fields": ["timetracking","billableSeconds", "customfield_13105", "created"],"maxResults": 200,"startAt": 0 }`;

        xhr.send(data);
    }

function simpleIsoDate(myDate)
    {
var year = myDate.getFullYear();
var month = myDate.getMonth()+1;
var dt = myDate.getDate();

if (dt < 10) {
  dt = '0' + dt;
}
if (month < 10) {
  month = '0' + month;
}

return year+'-' + month + '-'+dt;
    }


    function updateDaysRemaining(issueKey,daysPurchased,created, element) {
        var url = "/jira/rest/tempo-timesheets/4/worklogs/search";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                console.log(xhr.status);
                var myResponse = JSON.parse(xhr.responseText);
                var timeSpent = 0;
                for (var i = 0; i < myResponse.length; i++) {
                    timeSpent += myResponse[i].billableSeconds;
                }
                var timeSpentDays = timeSpent / 60 / 60 / 8;


                console.log(`${issueKey} days purchased : ${daysPurchased}, and timeSpentDays: ${timeSpentDays}`);

                
                var daysRemaining = daysPurchased - timeSpentDays;
                console.log(`Days remaining = ${daysRemaining} for ${issueKey}`);
                if (isIssueCardPage) {
                    updateCardWithValue(element, daysRemaining);
                }
                if (isReportPage) {
                    updateReportItemsithValue(element, daysRemaining);
                }
                return;
            }
        };



        var today = new Date();
        var toDate = new Date(today.setMonth(today.getMonth()+1))
        var data = `{"from": "${simpleIsoDate(created)}", "to": "${simpleIsoDate(toDate)}", "taskKey": ["${issueKey}"]}`;

        xhr.send(data);
        return;
    }


})();