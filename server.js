const express = require("express");
const puppeteer = require("puppeteer");
const ejs = require("ejs");

const app = express();
const port = 3000;

app.use(express.static("public"));

const unUrl = `https://udn.com/news/index`;
const ltUrl = `https://www.ltn.com.tw/`;
const chdUrl = `https://www.chinatimes.com/?chdtv`;

//////////////////////////////
//Functions for Scrapers

//For un
function getAllIndexes(arr, val) {
  var indexes = [],
    i;
  for (i = 0; i < arr.length; i++) if (arr[i] === val) indexes.push(i);
  return indexes;
}

//For un
function findHeadline(arr, idx) {
  const headlines = [];

  for (let i = 0; i < idx.length; i++) {
    headlines.push(arr[idx[i]]);
  }
  return headlines;
}

//For un
function trimHeadline(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i]
      .replace(" ", "")
      .replace("title", "")
      .replace("Link", "")
      .replace(/'/g, "")
      .replace(":", "")
      .replace(/\\/g, "")
      .replace(/,/g, "");
  }

  return arr;
}

//For un and lt
function createNewsObj(arr) {
  const objs = [];
  for (let i = 0; i < arr.length - 1; i += 2) {
    objs.push({
      title: arr[i],
      links: arr[i + 1],
    });
  }

  return objs;
}

//for lt
function combineInfo(info1, info2) {
  const combined = [];

  for (let i = 0; i < info1.length; i++) {
    combined.push(info1[i]);
    combined.push(info2[i]);
  }

  return combined;
}

//for chd
function combineTitles(arr) {
  let arrCombined = [];
  //combine two consecutive items in the array into one item, then put them in a new array
  for (let i = 0; i < arr.length - 2; i += 2) {
    arrCombined.push(arr[i] + " " + arr[i + 1]);
  }
  return arrCombined;
}

//for chd
async function loadTitles(el) {
  let items;
  let titleArray = "";
  let titleArrayCombined = [];

  //reload until gets all the headline titles, then save them in titleArray
  do {
    items = await el.getProperty("innerText");
    titleArray = await items.toString();
  } while (titleArray.length < 30);

  //clear unrelated values reteived from the titleArray
  titleArrayTrimed = [
    ...new Set(
      titleArray
        .substring(9)
        .split("\n")
        .filter((x) => x.length > 3)
    ),
  ];

  //reorganize the items in the titleArray and save them in a new array
  titleArrayCombined = combineTitles(titleArrayTrimed);
  return titleArrayCombined;
}

//////////////////////////////
//Scrapers

//scraper for Un
async function scrapeInfoUn(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const [el] = await page.$x('//script[contains(., "__UDN__.newsLists")]');
  const obj = await page.evaluate(function (el) {
    return el.innerText.split("\n").map((x) => x.trim());
  }, el);

  const indexes = getAllIndexes(obj, "type: 'picture',");
  const titlesIndex = indexes.map((x) => x + 2);
  const linksIndex = indexes.map((x) => x + 3);
  const totalIndex = [...titlesIndex, ...linksIndex].sort(function (a, b) {
    return a - b;
  });

  const headlines = trimHeadline(findHeadline(obj, totalIndex));
  const newsObjs = createNewsObj(headlines);

  console.log(newsObjs);
  return newsObjs;
}

//scraper for Lt
async function scrapeInfoLt(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const titles = await page.$$eval("#ltn_focus h2", (titles) => {
    return [...new Set(titles.map((x) => x.innerText))];
  });

  const links = await page.$$eval("#ltn_focus a", (links) => {
    return [...new Set(links.map((x) => x.getAttribute("href")))];
  });

  const headlines = combineInfo(titles, links);
  const newsObjs = createNewsObj(headlines);

  console.log(newsObjs);
  return newsObjs;
}

//scraper for Ch
async function scrapeInfoCh(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  let title;

  const [el] = await page.$x(
    `html/body/div[2]/div/div[2]/div[1]/div[1]/div[1]/div`
  );
  title = await loadTitles(el);

  const el2 = await page.$$eval("#adaptive-gallery-01 a", (a) => {
    let links = [];

    for (let i = 0; i < a.length; i++) {
      if (a[i].title && !a[i].title.includes("br")) {
        links.push({
          title: a[i].title,
          links: a[i].href,
        });
      }
    }

    links.pop();
    links.pop();
    return links;
  });

  console.log(el2);
  return el2;
}

//running server and render content

(async function () {
  const unHeadlines = await scrapeInfoUn(unUrl);
  const ltHeadlines = await scrapeInfoLt(ltUrl);
  const chdHeadlines = await scrapeInfoCh(chdUrl);

  app.get("/", (req, res) => {
    res.render("index", {
      un: unHeadlines,
      lt: ltHeadlines,
      chd: chdHeadlines,
    });
  });
})();

app.set("view engine", "ejs");

app.listen(port, () => console.log(`running on port ${port}`));
