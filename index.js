// https://github.com/sylvinus/node-crawler

// Author: Van-Duyet Le <lvduit08@gmail.com>

var Lazy = require('lazy');
var Crawler = require("crawler");
var url = require('url');
var mongoose = require('mongoose');


var baseUrl = 'http://forum.uit.edu.vn/';
var memberListUrl = baseUrl + 'memberlist.php?&pp=100';	// http://forum.uit.edu.vn/memberlist.php?page=2&order=asc&sort=username

var pages = Lazy.range(1, 309); // 308

mongoose.connect('mongodb://localhost/uit');

var Students = mongoose.model('Students', { id: String, name:String, subject:String });


var isStudentId = function (name) {
	return (name - 0) == name && (''+name).trim().length > 0;
}

var c = new Crawler({
    maxConnections : 50,

    forceUTF8: true,
    skipDuplicates: true, 

    onDrain: function() {
    	console.log('Done!');
    }, 

    // This will be called for each crawled page
    callback : function (error, result, $) {
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        /*
	        $('a').each(function(index, a) {
	            var toQueueUrl = $(a).attr('href');
	            c.queue(toQueueUrl);
	        });
		*/

		if (result) {

			var detailPage = $('h1 > #userinfo');
			if (detailPage.length > 0) {
				//console.log('Is Profile page');
				
				//console.log(detailPage);

				var studentId = $(detailPage).children('.member_username').text();
				var studentName = $(detailPage).children('.usertitle').text();
				var subject = $('#view-aboutme .subsection:nth-child(2) .blockbody > dl > dd').text();

				console.log(studentId + ' -- ' + studentName + ' -- ' + subject);

				var record = new Students({
					id: studentId,
					name: studentName,
					subject: subject
				});

				record.save(function(err) {
					if (err) {
						console.log('Error when save student detail!');
						console.log(err);
					}
				})

			} else {
				$('#memberlist_table tr td.username').each(function(index, u) {
					var studentId = $(u).children('a').text();

					if (isStudentId(studentId)) {
						var studentLink = $(u).children('a').attr('href');

						// Add to queue to get full user detail
						if (studentLink) {
							studentLink = baseUrl + studentLink;
							//console.log('Found new students link: ' + studentLink)
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