var fs = require('fs');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var cors = require('cors');
var app = express();

app.use(cors());

app.get('/scrape', function (req, res) {
    makeRequest(req, res);
});

function makeRequest(req, res) {
    url = 'https://www.lotto.net/irish-lotto/results/2017';
    console.log("Starting request...")
    request(url, function (error, response, html) {
        if (!error) {
            console.log('Request done with no errors!');
            var $ = cheerio.load(html);

            var data = [], numbers = [];

            $('.archive-list').each(function (i, element) {
                $('.row-2').each(function (index, element) {
                    numbers[index] = $(element).find('ul').text();
                });

                var lottoResults = {
                    day: $(element).find('.date span').text(),
                    date: $(element).find('.date').text(),
                    numbers: numbers[i],
                    bonus: $(element).find('.bonus-ball span').text(),
                    jackpot: $(element).find('.jackpot span').text(),
                }    
                data.push(lottoResults);
            });

            data.forEach(function(result, index){
                result.date = result.date.replace(result.day, "");
                result.date = result.date.trim();
                result.jackpot = result.jackpot.replace("Rollover!", "");
                result.jackpot = result.jackpot.replace(/\t/g, '');
                result.jackpot = result.jackpot.replace(/\n/g, '');
                result.jackpot = result.jackpot.replace("Jackpot Won!", "");
                result.jackpot = result.jackpot.trim();
                result.bonus = parseInt(result.bonus);
                result.numbers = result.numbers.replace(/\n/g, " ");
                result.numbers = result.numbers.replace(/\t/g, '');
                result.numbers = result.numbers.replace("Bonus", "");
                result.numbers = result.numbers.split(" "); // split the string into an array
                result.numbers = result.numbers.filter(function(e){ return e.replace(/(\r\n|\n|\r)/gm,"")}); // filter out empty elements and newlines
                for(var i=0; i<result.numbers.length; i++) { 
                    result.numbers[i] = parseInt(result.numbers[i], 10); // parse numbers into array of ints
                }
                result.numbers.splice(-1, 1); // remove bonus from numbers array
            });

            var json = { results: "" };

            json.results = data;
        }

        writeFile("data", json);
        res.send(json);
    });
}

function writeFile(name, file) {
    const dir = './data/';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const filename = `${dir}${name}.json`;

    fs.writeFile(filename, JSON.stringify(file, null, 4), err =>
        console.log('File successfully written: ' + filename)
    );
}

app.listen('8080')
console.log('Listening on port 8080');
exports = module.exports = app;


