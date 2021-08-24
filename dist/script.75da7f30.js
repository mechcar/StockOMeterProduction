// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"script.js":[function(require,module,exports) {
// APP using Yahoo Finance API calls to query various quotes for stocks traded on US exchanges
// Proper error handling to address invalid stock symbols and insufficient
// Displays top movers (% gain/ % loss/ most active by volume)
// Displays updated chart when available
var app = {}; // API information from: https://rapidapi.com/apidojo/api/yahoo-finance1

app.financeKey = "57edb9d42emsh2e21cedcaa1cecbp1f2a9ajsn8c9fb7947387";
app.financeHost = "apidojo-yahoo-finance-v1.p.rapidapi.com";
app.summaryURL = "https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=US"; // API requires at least one entry to return a summary, AMC chosen as default

app.symbol = "AMC"; // Function to call settings of top movers API call

app.movers = function () {
  return {
    async: true,
    crossDomain: true,
    url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-movers?region=US&lang=en-US&count=10&start=0",
    method: "GET",
    headers: {
      "x-rapidapi-key": app.financeKey,
      "x-rapidapi-host": app.financeHost
    }
  };
}; // Function to call settings of stock summary API call


app.summary = function () {
  return {
    async: true,
    crossDomain: true,
    url: "".concat(app.summaryURL, "&symbols=").concat(app.symbol),
    method: "GET",
    headers: {
      "x-rapidapi-key": app.financeKey,
      "x-rapidapi-host": app.financeHost
    }
  };
}; // Function to call settings of stock chart API call


app.chart = function () {
  return {
    async: true,
    crossDomain: true,
    url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-chart?interval=5m&symbol=".concat(app.symbol, "&range=1d&region=US"),
    method: "GET",
    headers: {
      "x-rapidapi-key": app.financeKey,
      "x-rapidapi-host": app.financeHost
    }
  };
}; // Function to call settings of profile API call


app.profile = function () {
  return {
    async: true,
    crossDomain: true,
    url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-profile?symbol=".concat(app.symbol, "&region=US"),
    method: "GET",
    headers: {
      "x-rapidapi-key": app.financeKey,
      "x-rapidapi-host": app.financeHost
    }
  };
}; // API call for top movers


app.getMovers = function () {
  var moversPromise = $.ajax(app.movers());
  return moversPromise.then(function (data) {
    // Storing objects of gainers, losers and most active stocks into accessible variables
    var moversObj = {
      gainers: data.finance.result[0],
      losers: data.finance.result[1],
      mostActive: data.finance.result[2]
    }; // Updates the current time to check if market is open

    app.updateTime(); // Hides most active stocks when market is closed as API returns no data at this time

    if (app.marketOpen() == "closed") {
      $(".movers").toggleClass("showMarketClosed");
    }

    var moverSize = 5; // Populates gainers container with buttons

    moversObj.gainers.quotes.slice(0, moverSize).forEach(function (quote) {
      var HTMLtoAppend = "<div class=\"gainer\">\n                <button id=\"moverSymbol\" value=".concat(quote.symbol, ">").concat(quote.symbol, "</button>\n            </div>");
      $(".gainers").append(HTMLtoAppend);
    }); // Populates losers container with buttons

    moversObj.losers.quotes.slice(0, moverSize).forEach(function (quote) {
      var HTMLtoAppend = "<div class=\"loser\">\n                <button id=\"moverSymbol\" value=".concat(quote.symbol, ">").concat(quote.symbol, "</button>\n            </div>");
      $(".losers").append(HTMLtoAppend);
    }); // Toggles CSS class to display gainers and losers

    $(".gainers").toggleClass("showFlex");
    $(".losers").toggleClass("showFlex"); // Checks if market is open to display most active stocks

    if (app.marketOpen() == "open") {
      $(".mostActive").toggleClass("showFlex"); // If market is open, movers container is populated with buttons

      moversObj.mostActive.quotes.slice(0, moverSize).forEach(function (quote) {
        var HTMLtoAppend = "<div class=\"mostActiveSymbols\">\n                    <button id=\"moverSymbol\" value=".concat(quote.symbol, ">").concat(quote.symbol, "</button>\n                </div>");
        $(".mostActive").append(HTMLtoAppend);
      });
    } // Links the buttons to subsequent API calls to pull up summary and chart data


    $("button").click(function (e) {
      e.preventDefault();
      app.symbol = $(this).val();
      app.getSummary(app.summary());
      app.getChart(app.chart());
      app.getProfile(app.profile());
    });
  });
}; // Function to handle and register stock symbol from text input


app.getSelectValue = function () {
  $("form").on("submit", function (e) {
    e.preventDefault(); // Registers stock symbol from search bar

    app.symbol = $("#symbol").val().toUpperCase(); // Error 1: handling symbols with length of more than 5 characters

    if (app.symbol.length > 5) {
      console.log("Error 1!");
      $(".quotesContent").addClass("hidden");
      $(".quotesContent").removeClass("show");
      $(".chart").addClass("hidden");
      $(".chart").removeClass("show");
      Swal.fire({
        title: "Error!",
        text: "It appears that ".concat(app.symbol, " is not a listed US security. Most symbols traded in the US have a symbol length between 1 and 5 characters. Did you mean ").concat(app.symbol.slice(0, 5), "?"),
        icon: "warning",
        confirmButtonText: "Continue",
        timer: 5000,
        timerProgressBar: true
      });
      $("#symbol").val("");
      $(".profileInformation").addClass("show");
      $(".profileInformation").removeClass("hidden");
    } // Proceeds to summary and chart API calls if the symbol is within accepted length
    else {
        $(".quotesContent").removeClass("hidden");
        $(".quotesContent").addClass("show");
        $(".chart").removeClass("hidden");
        $(".chart").addClass("show");
        app.getSummary(app.summary());
        app.getChart(app.chart());
        app.getProfile(app.profile());
      }
  });
}; // API call for stock summary


app.getSummary = function () {
  var summaryPromise = $.ajax(app.summary());
  return summaryPromise.then(function (data) {
    // Storing values in an accessible variable
    values = data.quoteResponse.result[0];
    console.log(values); // Error 2: if call returns no values

    if (typeof values === "undefined") {
      console.log("Error 2!");
      $(".quotesContent").addClass("hidden");
      $(".quotesContent").removeClass("show");
      $(".chart").addClass("hidden");
      $(".chart").removeClass("show");
      Swal.fire({
        title: "Error!",
        text: "It appears that ".concat(app.symbol, " is not a listed US security. Try another symbol."),
        icon: "warning",
        confirmButtonText: "Continue",
        timer: 3000,
        timerProgressBar: true
      });
      $("#symbol").val("");
      $(".profileInformation").addClass("show");
      $(".profileInformation").removeClass("hidden");
      return;
    } // Updates market time with each call


    app.updateTime(); // Checks symbol's corresponding exchange to determine if it is a US security

    validExchanges = ["NYQ", "PNK", "NMS", "YHD", "NCM", "NGM", "ARC", "BATS", "NGS", "OOTC", "OTC", "ASE"];
    exchange = values.exchange; // Error 3: handling for instances where certain values are not found

    if (!validExchanges.includes(exchange)) {
      console.log("Error 3!", exchange);
      $(".symbol").text("".concat(app.symbol));
      $(".quotesContent").addClass("hidden");
      $(".quotesContent").removeClass("show");
      $(".chart").addClass("hidden");
      $(".chart").removeClass("show");
      Swal.fire({
        title: "Error!",
        text: "It appears that ".concat(app.symbol, " is not a listed US security. It trades on ").concat(exchange, ". Try another symbol."),
        icon: "warning",
        confirmButtonText: "Continue",
        timer: 3000,
        timerProgressBar: true
      });
      $("#symbol").val("");
      $(".profileInformation").addClass("show");
      $(".profileInformation").removeClass("hidden");
      return;
    } else {
      // Begin populating div.values with values
      // Sign of market change stored for later use in chart formatting
      app.changeCheck = values.regularMarketChange; // Object to store desired values from successful API call

      var valuesObj = {
        longName: values.longName,
        previousClosingPrice: values.regularMarketPreviousClose,
        openingPrice: values.regularMarketOpen,
        price: values.regularMarketPrice,
        daysChangeDollars: values.regularMarketChange,
        daysChangePercent: values.regularMarketChangePercent,
        regularMarketDayLow: values.regularMarketDayLow,
        regularMarketDayHigh: values.regularMarketDayHigh,
        fiftyTwoWeekLow: values.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: values.fiftyTwoWeekHigh,
        regularMarketVolume: values.regularMarketVolume,
        averageVolume10Day: values.averageDailyVolume10Day
      }; // Confirming that the call returns all 13 pieces of information using a for loop

      var valuesObjEntries = Object.entries(valuesObj);
      var newValuesObjEntries = Object.entries(valuesObj); // If an entry is undefined, its value is changed to 0

      for (i = 0; i < valuesObjEntries.length; i++) {
        if (typeof valuesObjEntries[i][1] === "undefined") {
          newValuesObjEntries[i][1] = 0;
        }
      } // Converting the entries array back into an object


      var availableValuesObj = {
        longName: newValuesObjEntries[0][1],
        previousClosingPrice: newValuesObjEntries[1][1],
        openingPrice: newValuesObjEntries[2][1],
        price: newValuesObjEntries[3][1],
        daysChangeDollars: newValuesObjEntries[4][1],
        daysChangePercent: newValuesObjEntries[5][1],
        regularMarketDayLow: newValuesObjEntries[6][1],
        regularMarketDayHigh: newValuesObjEntries[7][1],
        fiftyTwoWeekLow: newValuesObjEntries[8][1],
        fiftyTwoWeekHigh: newValuesObjEntries[9][1],
        regularMarketVolume: newValuesObjEntries[10][1],
        averageVolume10Day: newValuesObjEntries[11][1]
      }; // Creating an array to check for unavailable data

      var availableValuesObjArr = Object.values(availableValuesObj); // Variable to track number of entries that are missing data

      app.check = 0;

      for (i = 0; i < availableValuesObjArr.length; i++) {
        if (availableValuesObjArr[i] === 0 || availableValuesObjArr[i] === "$0.00" || availableValuesObjArr[i] === "0.00%") {
          app.check += 1;
        }
      } // Error 4: handling symbols with insufficient data
      // If the entire array is comprised of the above values, then the symbol is considered inactive


      if (app.check == 12) {
        console.log("Error 4!");
        Swal.fire({
          title: "Error!",
          text: "It appears that ".concat(app.symbol, " is not an active US security. Try another symbol."),
          icon: "warning",
          confirmButtonText: "Continue",
          timer: 3000,
          timerProgressBar: true
        });
        $("#symbol").val("");
        $(".profileInformation").addClass("show");
        $(".profileInformation").removeClass("hidden");
      } else {
        // Populate quotesContent with values
        app.populate = function () {
          // Updates current time
          app.updateTime();

          app.pennyStockFormatter = function (value) {
            if (typeof value === "number") {
              if (value < 1) {
                return value.toFixed(3);
              } else {
                return value.toFixed(2);
              }
            } else {
              end = value[value.length - 1];

              if (value[0] === "$") {
                if (parseFloat(value.slice(1)) < 1) {
                  return "$".concat(parseFloat(value.slice(1)).toFixed(3));
                } else {
                  return "$".concat(parseFloat(value.slice(1)).toFixed(2));
                }
              } else if (value[end] === "%") {
                if (parseFloat(value.slice(0, end)) < 1) {
                  return "".concat(parseFloat(value.slice(0, end)).toFixed(3), "%");
                } else {
                  return "".concat(parseFloat(value.slice(0, end)).toFixed(2), "%");
                }
              }
            }
          }; // Updating variables to correct decimal places


          availableValuesObj.previousClosingPrice = app.pennyStockFormatter(availableValuesObj.previousClosingPrice);
          availableValuesObj.openingPrice = app.pennyStockFormatter(availableValuesObj.openingPrice);
          availableValuesObj.daysChangeDollars = app.bracketWrapNegatives(app.pennyStockFormatter(availableValuesObj.daysChangeDollars), "$");
          availableValuesObj.daysChangePercent = app.bracketWrapNegatives(app.pennyStockFormatter(availableValuesObj.daysChangePercent), "%");
          availableValuesObj.regularMarketDayLow = app.pennyStockFormatter(availableValuesObj.regularMarketDayLow);
          availableValuesObj.regularMarketDayHigh = app.pennyStockFormatter(availableValuesObj.regularMarketDayHigh);
          availableValuesObj.fiftyTwoWeekLow = app.pennyStockFormatter(availableValuesObj.fiftyTwoWeekLow);
          availableValuesObj.fiftyTwoWeekHigh = app.pennyStockFormatter(availableValuesObj.fiftyTwoWeekHigh);
          availableValuesObj.price = app.bracketWrapNegatives(app.pennyStockFormatter(availableValuesObj.price), "$"); // Populates longName, previousClosingPrice, openingPrice, daysChangeDollars and daysChangePercent spans

          $(".longName").text(availableValuesObj.longName);
          $(".previousClosingPrice").text("$".concat(availableValuesObj.previousClosingPrice));
          $(".openingPrice").text("$".concat(availableValuesObj.openingPrice));
          $(".daysChangeDollars").text(availableValuesObj.daysChangeDollars);
          $(".daysChangePercent").text(availableValuesObj.daysChangePercent); // Applying CSS class negativeValue to opening price if less than previous close

          if (parseFloat(availableValuesObj.openingPrice) < parseFloat(availableValuesObj.previousClosingPrice)) {
            $(".openingPrice").addClass("negativeValue");
          } // Otherwise the value is left green
          else {
              $(".openingPrice").removeClass("negativeValue");
            } // Applying CSS class negativeValue to Day's Change and price if negative


          if (values.regularMarketChange < 0) {
            $(".regularMarketPrice").addClass("negativeValue");
            $(".daysChangeDollars").addClass("negativeValue");
            $(".daysChangePercent").addClass("negativeValue");
          } // Otherwise the values are left green
          else {
              $(".regularMarketPrice").removeClass("negativeValue");
              $(".daysChangeDollars").removeClass("negativeValue");
              $(".daysChangePercent").removeClass("negativeValue");
            } // Populates daysRange, fiftyTwoWeekRange, regularMarketVolume and averageVolume10Day spans


          $(".daysRange").text("$".concat(availableValuesObj.regularMarketDayLow, " - $").concat(availableValuesObj.regularMarketDayHigh));
          $(".fiftyTwoWeekRange").text("$".concat(availableValuesObj.fiftyTwoWeekLow, " - $").concat(availableValuesObj.fiftyTwoWeekHigh));
          $(".regularMarketVolume").text("".concat(availableValuesObj.regularMarketVolume.toLocaleString("en-US")));
          $(".averageVolume10Day").text("".concat(availableValuesObj.averageVolume10Day.toLocaleString("en-US"))); // Displays quotesContent and sets symbol

          $("#quotesContent").addClass("show");
          $("#quotesContent").removeClass("hidden");
          $(".symbol").text("".concat(app.symbol));
        }; // Check whether market is open to display either "Current Price: " or "Close: "
        // Market open response:


        if (app.marketOpen() == "open") {
          app.populate();
          $(".regularMarketPrice").text("".concat(availableValuesObj.price));
        } // Market closed response:
        else {
            app.populate();
            $(".regularMarketPrice").addClass("hidden");
            $(".regularMarketPriceHeader").addClass("hidden");
            $(".closePrice").text("".concat(availableValuesObj.price));
            $(".closeHeader").removeClass("hidden");
            $(".closeHeader").addClass("show"); // Applying CSS class negativeValue to close price if day's change was negative

            if (values.regularMarketChange < 0) {
              $(".closePrice").addClass("negativeValue");
            } else {
              $(".closePrice").removeClass("negativeValue");
            }
          }
      }
    }
  });
}; // // Queries day's change to determine whether chart is displayed in red (-ve change) or green (+ve change)


app.getChartColor = function () {
  app.chartColor = "green";

  if (app.changeCheck < 0) {
    app.chartColor = "red";
  }
}; // API call for stock chart


app.getChart = function () {
  var chartPromise = $.ajax(app.chart());
  chartPromise.then(function (data) {
    // Run here in an attempt to make the color change more responsive to quick switches between red and green graphs
    app.getChartColor();
    var chartArr = data.chart.result[0];
    timeAxis = chartArr.timestamp;
    priceAxis = chartArr.indicators.quote[0].open; // Error 5: handling symbols with summary data but no graph data

    if (timeAxis == undefined && app.getSummary()) {
      console.log("Error 5!");
      $(".chart").addClass("hidden");
      $(".chart").removeClass("show");
      Swal.fire({
        title: "Error!",
        text: "It appears that ".concat(app.symbol, " does not have updated chart information."),
        icon: "warning",
        confirmButtonText: "Continue",
        timer: 3000,
        timerProgressBar: true
      });
      $("#symbol").val("");
    } // Error 6: handling symbols without graph timestamp, price or summary data
    else if (timeAxis == (undefined || null)) {
        console.log("Error 6!");
        $(".quotesContent").addClass("hidden");
        $(".quotesContent").removeClass("show");
        $(".chart").addClass("hidden");
        $(".chart").removeClass("show");
        Swal.fire({
          title: "Error!",
          text: "It appears that ".concat(app.symbol, " is not an active US security. It may have been delisted. Try another symbol."),
          icon: "warning",
          confirmButtonText: "Continue",
          timer: 3000,
          timerProgressBar: true
        });
        $("#symbol").val("");
        $(".profileInformation").addClass("show");
        $(".profileInformation").removeClass("hidden");
        return;
      } // Preparing the page for the addition of summary and graph data, and clearing any errors
      else {
          $(".quotesContent").removeClass("hidden");
          $(".quotesContent").addClass("show");
          $(".chart").removeClass("hidden");
          $(".chart").addClass("show");
        } // Finds index of array corresponding to 9:30am timestamp


    businessOpenEpoch = function businessOpenEpoch(arr) {
      for (i = 0; i < arr.length; i++) {
        if (app.epochToDate(arr[i]) === "9:30") {
          return i;
        }
      }
    }; // Finds index of array corresponding to either current time if the market is open or the 4:05pm timestamp if the market is closed.
    // This is used as the end index when querying the price data for the graph


    businessCloseEpoch = function businessCloseEpoch(arr) {
      for (j = 0; j < arr.length; j++) {
        if (app.epochToDate(arr[j]) === "16:05") {
          return j;
        } else if (j === arr.length) {
          return j;
        }
      }
    }; // Setting the variables for start and stop index of the time and price arrays


    var start = businessOpenEpoch(timeAxis);
    var stop = businessCloseEpoch(timeAxis); // Returns the data from indices within our desired range of 9:30am -> current time or 4:00pm

    getBusinessHoursIndex = function getBusinessHoursIndex(arr) {
      return arr.slice(start, stop);
    };

    timeAxis = getBusinessHoursIndex(timeAxis); // Converts the array of epoch to local time string (ex: "9:30","16:00")

    for (i = 0; i < timeAxis.length; i++) {
      timeAxis[i] = app.epochToDate(timeAxis[i]);
    } // Error 7: handling arrays that contain incomplete data from entire business day


    if (app.marketOpen() == "closed" && timeAxis.length < 75) {
      console.log("Error 7!");
      $(".chart").addClass("hidden");
      $(".chart").removeClass("show");
      Swal.fire({
        title: "Error!",
        text: "It appears that ".concat(app.symbol, " is missing chart data for parts of the regular market open."),
        icon: "warning",
        confirmButtonText: "Continue",
        timer: 3000,
        timerProgressBar: true
      });
      $("#symbol").val("");
    }

    priceAxis = getBusinessHoursIndex(priceAxis); // Formats the available price data into either 4 decimals (for stocks under $1) or 2 decimals

    for (i = 0; i < priceAxis.length; i++) {
      if (priceAxis[i] === null) {
        priceAxis[i] = priceAxis[i - 1];
      } else if (priceAxis[i] < 1.0) {
        priceAxis[i] = parseFloat(priceAxis[i].toFixed(4));
      } else {
        priceAxis[i] = parseFloat(priceAxis[i].toFixed(2));
      }
    } // Creates a 2D array by concatenating the timeAxis and priceAxis arrays
    // This is needed to format the dataTable used to display the graph in Google Charts


    concatArr = function concatArr(arrA, arrB) {
      return arrA.map(function (item, index) {
        return [item, arrB[index]];
      });
    };

    timePrice = concatArr(timeAxis, priceAxis); // Adds a top row to the 2D array containing the title "Time" and the symbol of the stock

    dataTable = [["Time", "".concat(app.symbol)]].concat(timePrice); // Loads the chart

    google.charts.load("current", {
      packages: ["corechart"]
    });
    google.charts.setOnLoadCallback(drawChart); // Checks window size to determine size of graph

    var heightWidthArr = [];

    function mediaQuery() {
      var size9 = window.matchMedia("(max-width: 1280px)");
      var size8 = window.matchMedia("(max-width: 1080px)");
      var size7 = window.matchMedia("(max-width: 860px)");
      var size6 = window.matchMedia("(max-width: 780px)");
      var size5 = window.matchMedia("(max-width: 710px)");
      var size4 = window.matchMedia("(max-width: 700px)");
      var size3 = window.matchMedia("(max-width: 500px)");
      var size2 = window.matchMedia("(max-width: 450px)");
      var size1 = window.matchMedia("(max-width: 380px)");

      if (size1.matches) {
        heightWidthArr.push(325, 325);
      } else if (size2.matches) {
        heightWidthArr.push(350, 350);
      } else if (size3.matches) {
        heightWidthArr.push(400, 400);
      } else if (size4.matches) {
        heightWidthArr.push(450, 450);
      } else if (size5.matches) {
        heightWidthArr.push(300, 300);
      } else if (size6.matches) {
        heightWidthArr.push(300, 350);
      } else if (size7.matches) {
        heightWidthArr.push(375, 350);
      } else if (size8.matches) {
        heightWidthArr.push(400, 450);
      } else if (size9.matches) {
        heightWidthArr.push(400, 600);
      } else {
        return null;
      }
    } // Draws the chart


    function drawChart() {
      mediaQuery();
      var prices = google.visualization.arrayToDataTable(dataTable); // Formatting options for graph

      options = {
        title: "".concat(app.symbol, " - ").concat(app.dateInNewTimezone),
        height: heightWidthArr[0],
        width: heightWidthArr[1],
        hAxis: {
          title: "Time",
          titleTextStyle: {
            color: "white"
          },
          textStyle: {
            color: "white"
          }
        },
        vAxis: {
          minValue: Math.min(priceAxis) - 5,
          maxValue: Math.max(priceAxis) + 5,
          title: "Price",
          titleTextStyle: {
            color: "white"
          },
          textStyle: {
            color: "white"
          }
        },
        legend: {
          textStyle: {
            color: "white"
          }
        },
        titleTextStyle: {
          color: "white"
        },
        backgroundColor: "black",
        chartArea: {
          backgroundColor: "black"
        },
        colors: ["".concat(app.chartColor)]
      }; // Calling graph

      var chart = new google.visualization.AreaChart(document.getElementById("graph"));
      chart.draw(prices, options);
      $(window).resize(function () {
        drawChart();
      });
    }
  });
};

app.getProfile = function () {
  var profilePromise = $.ajax(app.profile());
  profilePromise.then(function (data) {
    console.log(data);
    app.companyDescription = data.assetProfile.longBusinessSummary;
    console.log(app.companyDescription);

    if (app.companyDescription === undefined) {
      $(".profileInformation").addClass("hidden");
      Swal.fire({
        title: "Error!",
        text: "It appears that ".concat(app.symbol, " is missing information from its profile."),
        icon: "warning",
        confirmButtonText: "Continue",
        timer: 3000,
        timerProgressBar: true
      });
      $("#symbol").val("");
    } else {
      $(".profileInformation").empty(); // Populates profileInformation container

      var HTMLtoAppend = "<button class=\"getProfile\" value=".concat(app.symbol, ">View Profile</button>");
      $(".profileInformation").append(HTMLtoAppend); // Displays profile

      $(".profileInformation").on("click", function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        Swal.fire({
          title: "Profile for ".concat(app.symbol, ":"),
          text: app.companyDescription,
          icon: "info",
          width: 600,
          confirmButtonText: "Return to Quote"
        });
      });
      $("#symbol").val("");
    }
  });
}; // Helper functions
// Checks current time to verify whether market is open or closed


app.currentTime = function () {
  return new Date();
}; // Converts date to format usable for other calculations ()


app.dateConversion = function () {
  app.currentTime.toLocaleTimeString; // Options to return time in EST/EDT

  app.options = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }; // Converts local time to EST/EDT

  app.formatter = new Intl.DateTimeFormat("sv-SE", app.options);
  app.startingDate = app.currentTime();
  app.dateInNewTimezone = app.formatter.format(app.startingDate); // Grabbing hours and minutes in 24 hour format

  app.hours = parseInt(app.dateInNewTimezone.slice(8, 11));
  app.minutes = parseInt(app.dateInNewTimezone.slice(12, 15));
}; // Checks if current time is within 9:30am - 4:30pm EST/EDT


app.businessHours = function () {
  return app.hours >= 9 && app.minutes >= 30 || app.hours <= 16; // For market closed styling, uncomment code below:
  // return (app.hours < 9 && app.minutes < 30) || app.hours > 16;
}; // Checks if it is a weekday or weekend


app.dayOfWeek = app.currentTime().getDay();
app.isWeekend = app.dayOfWeek === 6 || app.dayOfWeek === 0; // Checks current market status

app.marketOpen = function () {
  if (app.isWeekend || !app.businessHours()) {
    return "closed";
  } else {
    return "open";
  }
}; // Populate date/time field on page


app.marketStatusAndTime = function () {
  $(".marketStatus").text("Market is currently ".concat(app.marketOpen(), "."));
  $(".currentTime").text("Last refreshed: ".concat(app.dateInNewTimezone));
}; // Condensed function to call all of the above


app.updateTime = function () {
  app.currentTime();
  app.dateConversion();
  app.marketOpen();
  app.marketStatusAndTime();
}; // Formats negative numbers to be displayed wrapped in brackets


app.bracketWrapNegatives = function (num, sym) {
  if (typeof num == "undefined") {
    return 0;
  }

  if (num[0] === "(" && num[num.length - 1] === ")") {
    num = "-".concat(num.slice(1, num.length - 1));
  }

  if (num[1] === "$") {
    num = num.slice(2);
  } else if (num[0] === "$") {
    num = num.slice(1);
  } else if (num[num.length - 1] === "%") {
    num = num.slice(0, num.length - 1);
  }

  num = parseFloat(num);

  if (num < 0) {
    if (sym === "$") {
      return "(".concat(sym).concat(Math.abs(num).toFixed(2), ")");
    } else if (sym === "%") {
      return "(".concat(Math.abs(num).toFixed(2)).concat(sym, ")");
    }
  } else {
    if (sym === "$") {
      return "".concat(sym).concat(num.toFixed(2));
    } else if (sym === "%") {
      return "".concat(num.toFixed(2)).concat(sym);
    }
  }
}; // Converts epoch (ms) to current time


app.epochToDate = function (epoch) {
  if (epoch < 10000000000) epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)

  var epoch = epoch + new Date().getTimezoneOffset() * -1; //for timeZone

  hours = new Date(epoch).getHours();
  minutes = new Date(epoch).getMinutes() + 1;

  if (minutes == 60) {
    minutes = "00";
    hours += 1;
  } else if (minutes == 5) {
    minutes = "05";
  }

  time = "".concat(hours, ":").concat(minutes);
  return time;
}; // Init


app.init = function () {
  this.getMovers();
  this.getSelectValue();
}; // DocReady


$(function () {
  app.init();
});
},{}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "50618" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","script.js"], null)
//# sourceMappingURL=/script.75da7f30.js.map