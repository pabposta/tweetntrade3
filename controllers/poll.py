import webapp2
from models.poller import Poller
from models.parser import Parser
from models.dao.tweet import Tweet

class PollController(webapp2.RequestHandler):
    default_interval = 60*60

    def get(self):
        interval = int(self.request.get('interval', self.default_interval))
        poller = Poller(interval)
        # search all tweets
        tweets = poller.search()
        # parse them
        parser = Parser()
        parsed_tweets = filter(None, [parser.parse_tweet(tweet) for tweet in tweets])
        # and finally write them to the datastore
        Tweet.multi_save(parsed_tweets)
