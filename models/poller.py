import tweepy
import urllib
import urllib2
import base64
import json
from models.time import Time


class AppAuthHandler(tweepy.auth.AuthHandler):
    # from http://shogo82148.github.io/blog/2013/05/09/application-only-authentication-with-tweepy/
    TOKEN_URL = 'https://api.twitter.com/oauth2/token'

    def __init__(self, consumer_key, consumer_secret):
        token_credential = urllib.quote(consumer_key) + ':' + urllib.quote(consumer_secret)
        credential = base64.b64encode(token_credential)

        value = {'grant_type': 'client_credentials'}
        data = urllib.urlencode(value)
        req = urllib2.Request(self.TOKEN_URL)
        req.add_header('Authorization', 'Basic ' + credential)
        req.add_header('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')

        response = urllib2.urlopen(req, data)
        json_response = json.loads(response.read())
        self._access_token = json_response['access_token']

    def apply_auth(self, url, method, headers, parameters):
        headers['Authorization'] = 'Bearer ' + self._access_token


class Poller(object):
    consumer_key = "9TGU7Kut5W6qucLdqDbB9e6Ge"
    consumer_secret = "rX8ILrGEDa1a2MZf3xMDNs1PSUPDsBp8pYq1HYHi82SJAu8Qam"
    search_keywords = ['SL', 'TP']
    page_size = 100  # 15 tweets per page. should be configurable up to 100, but it's not working, apparently the new
    # parameter is count and no longer rpp TODO check if it works with tweepy
    rate_limit = 450  # twitters rate limit
    max_results = page_size * rate_limit / 2  # let's be safe and only deplete half the rate in every call

    def __init__(self, interval):
        self.interval = interval
        auth = AppAuthHandler(self.consumer_key, self.consumer_secret)
        self.api = tweepy.API(auth)

    def calculate_since(self):
        since = Time.seconds_ago(self.interval)
        return since

    def search(self):
        since = self.calculate_since()
        query= '+'.join(self.search_keywords)
        tweets = []
        for tweet in tweepy.Cursor(self.api.search, q=query, count=self.page_size).items(self.max_results):
            # once we get to the minimum time, we are done
            if tweet.created_at < since:
                return tweets
            tweets.append(tweet)
        return tweets
