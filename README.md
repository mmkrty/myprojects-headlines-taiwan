## Why I built this App?

I built tis app to compare headlines of three main newspaper websites in Taiwan through a Javascript library named Puppeteer. The News is a important media that forms our understanding of the world today. However, different political tendencies and ideologies can influence the perspectives of different news agency. By comparing them we can learn to recognize the source of the information we see everyday.

## Functionality

This is a simple web scraping app which extracts the news in the main slider of three main newspaper websites in Taiwan.

[Source code](https://mmkrty.github.io/myprojects-history-today/)

## Difficulties encountered

- Asyncronous is the theme of this project. I hit a lot of bumps when trying to utilize the function of puppeteer. Although I managed to solve most of them, I still can't quite reach the result I anticipated. I still need to find a better way to render datas from async functions to the DOM. Presently I put the whole app.get("/",...) in a IIFE function.

- The structures of the three websites I try to scrape are totally different. Thus, I needed to customize every sraping route by going through them in the Chrome developers tool one by one. Also, saving the datas I need (which is the title and the link of the headlings) to objects require many string and array methods.

## Improvements to be made

### Asynchrony:

- As mentioned above, the present way I run the app is not ideal. The user would need to reload the page manually until the functions load all the data. Should find a better way. Or maybe render a waiting page first.
