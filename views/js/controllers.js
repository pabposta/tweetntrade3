var tweetNTradeApp = angular.module('tweetNTrade', ['nvd3']);

tweetNTradeApp.controller('ScoresCtrl', ScoresCtrl);
ScoresCtrl.$inject = ['$scope', '$http'];
function ScoresCtrl($scope, $http) {

    var seriesWithOutliers, seriesWithoutOutliers;

    $scope.init = function () {
        $scope.hours = 1;
        $scope.excludeOutliers = 1;
        $scope.$watch("hours", updateScores);
        $scope.$watch("excludeOutliers", decideSeries);
    };

    function updateScores() {
        var url = '/tweets?hours=' + $scope.hours;
        $http.get(url).success(function (data) {
            var bySymbol = {};
            for (var i = 0; i < data.length; i++) {
                var symbol = data[i].symbol;
                if (bySymbol[symbol]) bySymbol[symbol].push(data[i]);
                else bySymbol[symbol] = [data[i]];
            }

            var valuesBySymbolWithOutliers = calcValuesBySymbol(bySymbol);
            var    valuesBySymbolWithoutOutliers = excludeOutliers(valuesBySymbolWithOutliers);
            seriesWithOutliers = bucketsToSeriesNvd3(calcBucketsBySymbol(valuesBySymbolWithOutliers));
            seriesWithoutOutliers = bucketsToSeriesNvd3(calcBucketsBySymbol(valuesBySymbolWithoutOutliers));

            $scope.chartOptions = {
                chart: {
                    type: 'multiBarChart',
                    height: 450,
                    margin : {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 45
                    },
                    clipEdge: true,
                    staggerLabels: true,
                    transitionDuration: 500,
                    stacked: false
                }
            };
            decideSeries();
        });
    }

    function decideSeries() {
        $scope.series = $scope.excludeOutliers ? seriesWithoutOutliers : seriesWithOutliers;
    }

    function excludeOutliers(valuesBySymbol) {
        var filteredValuesBySymbol = {};
        for (var symbol in valuesBySymbol) {
            var values = valuesBySymbol[symbol],
                longTargetMean = ss.mean(values.longTP),
                longTargetStd = ss.standardDeviation(values.longTP),
                longStopMean = ss.mean(values.longSL),
                longStopStd = ss.standardDeviation(values.longSL),
                shortTargetMean = ss.mean(values.shortTP),
                shortTargetStd = ss.standardDeviation(values.shortTP),
                shortStopMean = ss.mean(values.shortSL),
                shortStopStd = ss.standardDeviation(values.shortSL);

            filteredValuesBySymbol[symbol] = {
                longTP: values.longTP.filter(excludeFunc(longTargetMean, longTargetStd)),
                longSL: values.longSL.filter(excludeFunc(longStopMean, longStopStd)),
                shortTP: values.shortTP.filter(excludeFunc(shortTargetMean, shortTargetStd)),
                shortSL: values.shortSL.filter(excludeFunc(shortStopMean, shortStopStd))
            };
            var filteredValues = filteredValuesBySymbol[symbol],
                allValues = filteredValues.longTP.concat(filteredValues.longSL).concat(filteredValues.shortTP).
                            concat(filteredValues.shortSL);
            filteredValues.min = Math.min.apply(Math, allValues);
            filteredValues.max = Math.max.apply(Math, allValues);
        }
        return filteredValuesBySymbol;
    }

    function excludeFunc(mean, stdev) {
        return function (value) {
            return mean - 2 * stdev <= value && value <= mean + 2 * stdev;
        }
    }

    function calcValuesBySymbol(bySymbol) {
        var valuesBySymbol = {};
        for (var symbol in bySymbol) {
            var tweets = bySymbol[symbol],
                values = {longSL: [], longTP: [], shortSL: [], shortTP: [], min: Number.MAX_VALUE,
                          max: Number.MIN_VALUE};
            for (var i = 0; i < tweets.length; i++) {
                var stop = tweets[i].stop;
                var target = tweets[i].target;
                if (stop <= target) {
                    values.longSL.push(stop);
                    values.longTP.push(target);
                }
                else {
                    values.shortSL.push(stop);
                    values.shortTP.push(target);
                }
                values.min = Math.min(values.min, stop, target);
                values.max = Math.max(values.max, stop, target);
            }
            valuesBySymbol[symbol] = values;
        }
        return valuesBySymbol;
    }

    function calcBucketsBySymbol(valuesBySymbol) {
        var bucketsBySymbol = {};
        for (var symbol in valuesBySymbol) {
            var NUM_BUCKETS = 50;
            var min = valuesBySymbol[symbol].min;
            var delta = (valuesBySymbol[symbol].max - min) / (NUM_BUCKETS - 1);
            if (delta == 0) {
                // this actually happens. a symbol where TP and SL have the same values and those are the only
                // values there are
                continue;
            }
            bucketsBySymbol[symbol] = [];
            for (var i = 0; i < NUM_BUCKETS; i++) {
                bucketsBySymbol[symbol].push({
                    x: min + delta * i, yLongSL: 0, yLongTP: 0, yShortSL: 0,
                    yShortTP: 0
                });
            }
            for (var i = 0; i < valuesBySymbol[symbol].longSL.length; i++) {
                var bucket = parseInt((valuesBySymbol[symbol].longSL[i] - min) / delta);
                bucketsBySymbol[symbol][bucket].yLongSL++;
            }

            for (var i = 0; i < valuesBySymbol[symbol].longTP.length; i++) {
                var bucket = parseInt((valuesBySymbol[symbol].longTP[i] - min) / delta);
                bucketsBySymbol[symbol][bucket].yLongTP++;
            }
            for (var i = 0; i < valuesBySymbol[symbol].shortSL.length; i++) {
                var bucket = parseInt((valuesBySymbol[symbol].shortSL[i] - min) / delta);
                bucketsBySymbol[symbol][bucket].yShortSL++;
            }
            for (var i = 0; i < valuesBySymbol[symbol].shortTP.length; i++) {
                var bucket = parseInt((valuesBySymbol[symbol].shortTP[i] - min) / delta);
                bucketsBySymbol[symbol][bucket].yShortTP++;
            }
        }
        return bucketsBySymbol;
    }

    function bucketsToSeriesNvd3(bucketsBySymbol) {
        var series = [];
        for (var symbol in bucketsBySymbol) {
            var longSL = bucketsBySymbol[symbol].map(function(point) {
                return {x: point.x.toFixed(4), y: point.yLongSL};
            }),
            longTP = bucketsBySymbol[symbol].map(function(point) {
                return {x: point.x.toFixed(4), y: point.yLongTP};
            }),
            shortSL = bucketsBySymbol[symbol].map(function(point) {
                return {x: point.x.toFixed(4), y: -point.yShortSL};
            }),
            shortTP = bucketsBySymbol[symbol].map(function(point) {
                return {x: point.x.toFixed(4), y: -point.yShortTP};
            });
            series.push({
                symbol: symbol,
                data: [
                    {key: 'Long TP', values: longTP},
                    {key: 'Short TP', values: shortTP},
                    {key: 'Long SL', values: longSL},
                    {key: 'Short SL', values: shortSL}
                ]
            });
        }
        series.sort(function(a, b) {
            var volumeA = 0,
                volumeB = 0;
            for (var i = 0; i < a.data.length; i++) {
                for (var j = 0; j < a.data[i].values.length; j++) {
                    volumeA += Math.abs(a.data[i].values[j].y);
                }
            }
            for (var i = 0; i < b.data.length; i++) {
                for (var j = 0; j < b.data[i].values.length; j++) {
                    volumeB += Math.abs(b.data[i].values[j].y);
                }
            }
            return volumeB - volumeA;
        });
        return series;
    }

    function bucketsToSeriesChartJs(bucketsBySymbol) {
        var series = [];
        for (var symbol in bucketsBySymbol) {
            var x = bucketsBySymbol[symbol].map(function(point) {
                return point.x.toFixed(4);
            }),
                longSL = bucketsBySymbol[symbol].map(function(point) {
                return point.yLongSL;
            }),
                longTP = bucketsBySymbol[symbol].map(function(point) {
                return point.yLongTP;
            }),
                shortSL = bucketsBySymbol[symbol].map(function(point) {
                return point.yShortSL;
            }),
                shortTP = bucketsBySymbol[symbol].map(function(point) {
                return point.yShortTP;
            }),
            data = {
                x: x,
                y: [longSL, longTP, shortSL, shortTP],
                names: ['Long SL', 'Long TP', 'Short SL', 'Short TP'],
                symbol: symbol,
                colors: ['#0fbffa', '#316638', '#10b524', '#10f4b5']
            };
            series.push(data);
        }
        series.sort(function(a, b) {
            var volumeA = 0,
                volumeB = 0;
            for (var i = 0; i < a.y.length; i++) {
                for (var j = 0; j < a.y[i].length; j++) {
                    volumeA += Math.abs(a.y[i][j]);
                }
            }
            for (var i = 0; i < b.y.length; i++) {
                for (var j = 0; j < b.y[i].length; j++) {
                    volumeB += Math.abs(b.y[i][j]);
                }
            }
            return volumeB - volumeA;
        });
        return series;
    }
}
