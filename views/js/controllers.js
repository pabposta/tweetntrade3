var tweetNTradeApp = angular.module('tweetNTrade', ['chart.js']);

tweetNTradeApp.controller('ScoresCtrl', ScoresCtrl);
ScoresCtrl.$inject = ['$scope', '$http'];
function ScoresCtrl($scope, $http) {

    $scope.init = function() {
        $http.get('/scores/EURUSD?count=48').success(function(data) {
            $scope.scores = data.scores;
            $scope.scores.reverse();  // the array comes from the server sorted from most recent to oldest
            $scope.scores.map(function(score) {
                score.timestamp = moment(score.timestamp * 1000).format("HH:mm");
            });
            rawScores();
            volume();
            hourlyScores();
            latestScore();
        });
    };

    function rawScores() {
        $scope.rawScoresSeries = ['Score'];

        $scope.rawScoresX = $scope.scores.map(function(score) {
            return score.timestamp;
        });

        $scope.rawScoresY = [$scope.scores.map(function(score) {
            return (score.score * 100.0).toFixed(2);
        }),
        $scope.scores.map(function(score) {
            if (score == $scope.scores[0] || score == $scope.scores[$scope.scores.length - 1])
                return 0.0;
            return null;
        })];

        $scope.rawScoresOptions = {
            datasetFill: false
        };
    }

    function volume() {
        $scope.volumeSeries = ['Volume'];

        $scope.volumeX = $scope.scores.map(function(score) {
            return score.timestamp;
        });

        $scope.volumeY = [$scope.scores.map(function(score) {
            return score.volume;
        })];
    }

    function hourlyVolumeWeightedAverage() {
        // split scores into groups of two
        var size = 2,
            scoreGroups = [],
            avgScores = [],
            labels = [];
        for (var i = 0; i < $scope.scores.length; i += size) {
            scoreGroups.push($scope.scores.slice(i, size+i));
        }
        for (i = 0; i < scoreGroups.length; i++) {
            var scoreSum = 0,
                volumeSum = 0;
            for (var j = 0; j < scoreGroups[i].length; j++) {
                scoreSum += scoreGroups[i][j].score * scoreGroups[i][j].volume;
                volumeSum += scoreGroups[i][j].volume;
            }
            var avgScore = volumeSum ? scoreSum / volumeSum : 0;
            avgScores.push(avgScore);
            labels.push(scoreGroups[i][0].timestamp);
        }
        $scope.hvwa = avgScores;
        $scope.hourlyLabels = labels;
    }

    function decimalToHex(decimal) {
        decimal = Math.max(decimal, 0);
        var hex = decimal.toString(16);
        if (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    }

    function color(score) {
        var r = Math.round(-score * 127 + 127),
            g = Math.round(score * 127 + 127),
            b = Math.round(127 - Math.abs(score) * 127),
            hex = '#' + decimalToHex(r) + decimalToHex(g) + decimalToHex(b);
        return hex;
    }

    function hourlyScores() {
        hourlyVolumeWeightedAverage();

        $scope.hourlyScoresX = $scope.hourlyLabels;

        $scope.hourlyScoresY = $scope.hvwa.map(function(score) {
            return (Math.abs(score) * 100.0).toFixed(2);
        });

        $scope.hourlyScoresOptions = {
            scaleBeginAtZero: false
        };

        $scope.hourlyScoresColours = $scope.hvwa.map(color);
    }

    function latestScore() {
        var score = $scope.hvwa[$scope.hvwa.length - 3];
        var hex = color(score);
        score = (score * 100.0).toFixed(2);
        $scope.latestScoreX = [$scope.hourlyLabels[$scope.hourlyLabels.length - 1], ''];
        $scope.latestScoreColours = [hex, '#7f7f7f'];
        if (score < 0) {
            score *= -1;
        }
        $scope.latestScoreY = [score, 100.0 - score];

        var maxVolume = $scope.scores.reduce(function(max, score) {
           return Math.max(max, score.volume);
        }, 0);
        var volumeInPercent = maxVolume ? $scope.scores[$scope.scores.length - 1].volume / maxVolume : 0;
        var donutWidth = 95.0 - volumeInPercent * 60;
        $scope.latestScoreOptions = {
            percentageInnerCutout: donutWidth
        };
    }
}