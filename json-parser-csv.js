const fs = require("fs");
const csv = require('csv-parser');
let records = [];

function validate(records) {
    let err = new Set();
    records.forEach(r => {
        ['author', 'title', 'text', 'source'].forEach(f => {
            if (!r.hasOwnProperty(f) || !r[f].length) err.add(r);
        });
    });
    return Array.from(err);
}

function writeRecords(records, file) {
    let errors = validate(records);
    if (errors.length) {
        //errors = errors.filter(e => e.text.length < 1);
        console.log(JSON.stringify(errors, 0, 2));
        console.log('Found ' + errors.length + '/' + records.length + ' bad records');
        return;
    }
    try {
        require('fs').writeFileSync(file, JSON.stringify(records, 0, 2));
        console.log('writing ' + file)
    } catch (err) {
        console.error(err);
    }
}

const parseCSVFile = function (path, name) {
    fs.createReadStream(path)
        .pipe(csv())
        .on('data', (row) => {
            const source = name;
            let title = row["Title"];
            title = title.replace(/[\r\n]/g, "");
            title = title.trim();
            let text = row["Poem"];
            text = text.replace(/[\r\n]/g, " ");
            text = text.replace(/[\036\025]/g, " ");
            text = text.trim();
            text = text.replace(/\s+/g, " ");
            let author = row["Poet"];
            author = author.trim();
            let tags = row["Tags"];
            tags = tags.trim();
            tagsArr = tags.split(",");
            for (let i = 0; i < tagsArr.length; i++) {
                tagsArr[i] = tagsArr[i].replace(",", "");
                tagsArr[i] = tagsArr[i].trim();
            }
            if (author && author.length > 0 && title && title.length > 0 && text && text.length > 0) {
                records.push({
                    "source": source,
                    "author": author,
                    "title": title,
                    "text": text,
                    "entry_tags": tagsArr
                });
            }
        })
        .on('end', () => {
            console.log(path + ' successfully read');
            writeRecords(records, "./data/"+name+".json");
            records = [];
        });
}


parseCSVFile('text/Poetry_Foundation.csv', "Poetry_Foundation");

