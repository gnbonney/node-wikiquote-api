var API_URL = "https://en.wikiquote.org/w/api.php"
var Client = require("node-rest-client").Client
var client = new Client()
var cheerio = require("cheerio")



var getRandomQuote = function(handleSuccess,handleError,titles) {

    var defaultList = [
      "Mahatma Gandhi",
      "Albert Einstein",
      "Martin Luther King, Jr.",
      "Leonardo da Vinci",
      "Walt Disney",
      "Edgar Allan Poe",
      "Sigmund Freud",
      "Thomas A. Edison",
      "Robin Williams",
      "Steve Jobs"
    ]

    var titleList = []
    titleList =  titles ? titles : defaultList  
    randomInt = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    var titleName = titleList[randomInt(0,titleList.length)]
    randomQuoteByTitle(titleName,200, q => handleSuccess(titleName,q) , e => handleError(e) )

}




/**
 * Get a random quote for the given title search.
 * This function searches for a page id for the given title, chooses a random
 * section from the list of sections for the page, and then chooses a random
 * quote from that section.  Returns the titles that were used in case there
 * is a redirect.
 */
var randomQuoteByTitle = function (titleName, maxLimit, handleSuccess, handleError) {

  function selectRandomQuote(quotes) {
    if (quotes.length === 0) {
      handleError("No Quotes Found")
    }

    var randomNumber = Math.floor(Math.random() * quotes.length)
    var quote = quotes[randomNumber]

    if (quote === null || quote.length > maxLimit)
      return selectRandomQuote(quotes)

    handleSuccess(quote)
  }

  getQuotes(titleName, maxLimit, selectRandomQuote, handleError)
}



/**
 * Get all the quotes and do a little cleanup 
 */

var getQuotes = function (titleName, maxLimit, handleSuccess, handleError) {
  function saveQuotesForSection(quotes, lastQuotes) {
    var allQuotes = []
    if (lastQuotes === true) {
      for (var q in quotes) {
        var $ = cheerio.load(quotes[q])
        allQuotes.push($.text())
      }
      handleSuccess(allQuotes)
    }
  }
  getQuotesForSection(titleName, saveQuotesForSection, handleError)
}



/**
 * Get all quotes for a given section.  Most sections will be of the format:
 * <h3> title </h3>
 * <ul>
 *   <li>
 *     Quote text
 *     <ul>
 *       <li> additional info on the quote </li>
 *     </ul>
 *   </li>
 * <ul>
 * <ul> next quote etc... </ul>
 *
 * The quote may or may not contain sections inside <b/> tags.
 *
 * For quotes with bold sections, only the bold part is returned for brevity
 * (usually the bold part is more well known).
 * in case there is a redirect.
 */
var getQuotesForSection = function (titleName, handleSuccess, handleError) {
  function loadSections(sections, pageId) {
    var quoteArray = []
    var requests = []

    for (var s in sections) {
      var args = {
        parameters: {
          format: "json",
          action: "parse",
          noimages: "",
          pageid: pageId,
          section: sections[s]
        }
      }

      var request = client.get(API_URL, args, function (result, response) {
        requests.pop()
        var done = false
        if (requests.length === 0) {
          done = true
        }
        var quotes = result.parse.text["*"]
        var $ = cheerio.load(quotes)
        $("li:not(li li)").each(function (i, elem) {
          var bolds = $(this)
            .find("b")
            .html()
          if (bolds !== null) quoteArray.push(bolds)
        })

        if (quoteArray != null) {
          handleSuccess(quoteArray, done)
        }
      })
      requests.push(request)
    }
  }
  getSectionsForPage(titleName, loadSections, handleError)
}




/**
 * Get the sections for a given page.
 * This makes parsing for quotes more manageable.
 * Returns an array of all "1.x" sections as these usually contain the quotes.
 * If no 1.x sections exists, returns section 1. Returns the titles that were used
 * in case there is a redirect.
 */
var getSectionsForPage = function (titleName, handleSuccess, handleError) {

  function findSections(pageId) {
    return function (result, response) {
      var sectionArray = []
      var sections = result.parse.sections
      for (var s in sections) {
        var splitNum = sections[s].number.split(".")
        if (splitNum.length > 1) {
          sectionArray.push(sections[s].index)
        }
      }
      // Use section 1 if there are no "1.x" sections
      if (sectionArray.length === 0) {
        sectionArray.push("1")
      }
      handleSuccess(sectionArray, pageId)
    }
  }

  function getPageId(pageId) {
    var args = {
      parameters: {
        format: "json",
        action: "parse",
        prop: "sections",
        pageid: pageId
      }
    }

    client.get(API_URL, args, findSections(pageId))
  }
  getQuery(titleName, getPageId, handleError)
}




/**
 * 
 *   any sentence
 * Returns the input string with the first alphabet of each word capitalize
 */

function capitalizeString(input) {
  var inputArray = input.split(" ")
  var output = []
  for (s in inputArray) {
    output.push(inputArray[s].charAt(0).toUpperCase() + inputArray[s].slice(1))
  }
  return output.join(" ")
}




/**
 * 
 *  
 * Query based on "titleName" parameter and return page id.
 * If multiple page ids are returned, choose the first one.
 * Query includes "redirects" option to automatically traverse redirects.
 * All words will be capitalized as this generally yields more consistent results.
 */
var getQuery = function (titleName, handleSuccess, handleError) {
  titleName = capitalizeString(titleName)

  var args = {
    parameters: {
      format: "json",
      action: "query",
      redirects: "",
      titles: titleName
    }
  }

  client.get(API_URL, args, function (data, response) {
    var pages = data.query.pages
    var pageId = -1
    for (var p in pages) {
      var page = pages[p]
      // api can return invalid recrods, these are marked as "missing"
      if (!("missing" in page)) {
        pageId = page.pageid
        break
      }
    }
    if (pageId > 0) {
      handleSuccess(pageId)
    } else {
      handleError("No results")
    }
  })
}


module.exports.getRandomQuote = getRandomQuote
module.exports.randomQuoteByTitle = randomQuoteByTitle