from time import mktime
from google.appengine.ext import ndb


class Tweet(ndb.Model):
    symbol = ndb.StringProperty(required=True)
    timestamp = ndb.DateTimeProperty(required=True)
    stop = ndb.FloatProperty(required=True, indexed=False)
    target = ndb.FloatProperty(required=True, indexed=False)

    @staticmethod
    def multi_save(tweets):
        ndb.put_multi(tweets)
        return tweets

    @staticmethod
    def get_tweets_after(timestamp):
        tweets = Tweet.query(Tweet.timestamp >= timestamp).fetch()
        return tweets

    def to_json(self):
        as_json = '{{"symbol":"{}","timestamp":{},"stop":{},"target":{}}}'.\
                  format(self.symbol, long(mktime(self.timestamp.timetuple())), self.stop, self.target)
        return as_json

    @staticmethod
    def list_to_json(tweets):
        as_json = '[{}]'.format(','.join(tweet.to_json() for tweet in tweets))
        return as_json