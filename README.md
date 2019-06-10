# node-wikiquote-api

### About
NodeJs implementation of wikiquote api
 - Fetches a random quote
 - Fetcher a random quote of any specific person 
<br>



### Installation

```
  npm install node-wikiquote-api 

```

### Use
A use case is available in sample.js
![sample use image](/assets/images/sample.jpg)


```
var WikiQuote  = require('./node-wikiquote-api')

/**
 * @param {array} titles A list of names of authors : optional
 * if not provided , it uses a default list
 * @param {function} handleSuccess Callback function
 * @param {function} handleError Callback function for errors
 * Get some random quote */
WikiQuote.getRandomQuote(handleRandomQuote,handleError)

/**
 * @param {string} titleName Name of author
 * @param {integer} maxLimit max length of words 
 * Get the quote by Title name */
WikiQuote.randomQuoteByTitle("mahatma gandhi",200,handleRandomQuoteByTitle,handleError)

/** 
 * Callback function for getRandomQuote
 * title contains the quote author
 * quote contains the quote   * */ 
function handleRandomQuote(title, quote){
    console.log(title)
    console.log(quote)
}

/** Callback function for randomQuoteByTitle
 * quote contains the quote*/
function handleRandomQuoteByTitle(quote){
    console.log(quote)
}
// Handles Erro
function handleError(error){
    console.log(error)
}

```

