var tweetNTradeApp = angular.module('tweetNTrade', ['nvd3']);

tweetNTradeApp.controller('ScoresCtrl', ScoresCtrl);
ScoresCtrl.$inject = ['$scope', '$http'];
function ScoresCtrl($scope, $http) {

    $scope.init = function() {
        $http.get('/tweets').success(function(data) {
            var bySymbol = {};
            for (var i = 0; i < data.length; i++) {
                var symbol = data[i].symbol;
                if (bySymbol[symbol]) bySymbol[symbol].push(data[i]);
                else bySymbol[symbol] = [data[i]];
            }
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
            var bucketsBySymbol = {};
            for (var symbol in valuesBySymbol) {
                var NUM_BUCKETS = 50;
                var min = valuesBySymbol[symbol].min;
                var delta = (valuesBySymbol[symbol].max - min) / (NUM_BUCKETS - 1);
                bucketsBySymbol[symbol] = [];
                for (var i = 0; i < NUM_BUCKETS; i++) {
                    bucketsBySymbol[symbol].push({x: min + delta * i, yLongSL: 0, yLongTP: 0, yShortSL: 0,
                                                  yShortTP: 0});
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
            $scope.series = bucketsToSeriesNvd3(bucketsBySymbol);
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
        });
    };

    function bucketsToSeriesNvd3(bucketsBySymbol) {
        var series = {};
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
            series[symbol] = [
                {key: 'Long TP', values: longTP},
                {key: 'Short TP', values: shortTP},
                {key: 'Long SL', values: longSL},
                {key: 'Short SL', values: shortSL}
            ];
        }
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
                    volumeA += a.y[i][j];
                }
            }
            for (var i = 0; i < b.y.length; i++) {
                for (var j = 0; j < b.y[i].length; j++) {
                    volumeB += b.y[i][j];
                }
            }
            return volumeB - volumeA;
        });
        return series;
    }
}
