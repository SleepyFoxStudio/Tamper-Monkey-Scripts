// ==UserScript==
// @name         MM Scroll to selected user in List
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Normally MM does not scroll after refreshing the page, with this script we now scroll down to the selected user after refresh
// @author       Mark Richardson
// @match        *.sdlmedia.com/vms/calamares/users/users/default.asp*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var myEl = document.getElementById('menucontent_listpage_list');

    window.onload = function() {
        var y = myEl.getElementsByClassName('selected');
        myEl.scrollTop = myEl.scrollTop = y[0].offsetTop - 150;
    };
})();


