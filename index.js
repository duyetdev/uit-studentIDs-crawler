// Author: Van-Duyet Le <lvduit08@gmail.com>
// Crawler modules: https://github.com/sylvinus/node-crawler

var Lazy = require('lazy');
var Crawler = require("crawler");
var url = require('url');

// Variable 
var baseUrl = 'http://forum.uit.edu.vn/';
var memberListUrl = baseUrl + 'memberlist.php?&pp=100';	// http://forum.uit.edu.vn/memberlist.php?page=2&order=asc&sort=username
var pages = Lazy.range(1, 309); // 308


var Students = [];

//var Students = mongoose.model('Students', { id: String, name:String, subject:String });

var isStudentId = function (name) {
	return (name - 0) == name && (''+name).trim().length > 0;
}

var c = new Crawler({
	maxConnections : 50,

	forceUTF8: true,
	skipDuplicates: true, 

	onDrain: function() {
		console.log('Done!');
		var jf = require('jsonfile');
		var file = 'result.json';
		
		jf.writeFile(file, Students, function(err) {
		  console.log(err);
		  process.exit(0);
		});
	}, 

    // This will be called for each crawled page
    callback : function (error, result, $) {
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
		if (result) {
			var detailPage = $('h1 > #userinfo');
			if (detailPage.length > 0) {
				var studentId = $(detailPage).children('.member_username').text();
				var studentName = $(detailPage).children('.usertitle').text();
				var subject = $('#view-aboutme .subsection:nth-child(2) .blockbody > dl > dd').text();

				console.log(studentId + ' -- ' + studentName + ' -- ' + subject);

				Students.push({
					id: studentId,
					name: studentName,
					subject: subject
				});

			} else {
				$('#memberlist_table tr td.username').each(function(index, u) {
					var studentId = $(u).children('a').text();

					if (isStudentId(studentId)) {
						var studentLink = $(u).children('a').attr('href');

						// Add to queue to get full user detail
						if (studentLink) {
							studentLink = baseUrl + studentLink;
							console.log('Found new students link: ' + studentLink)
							c.queue(studentLink);	
						}
					}
				});
			}
		}
    }
});


// Queue just one URL, with default callbacks
pages.forEach(function(p) {
	var pageLink = memberListUrl + '&page=' + p;

	console.log('Adding to queue: ' + pageLink);
	c.queue(pageLink);
});