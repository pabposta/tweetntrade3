import webapp2
from datetime import datetime, timedelta
from models.dao.tweet import Tweet


class TweetsController(webapp2.RequestHandler):
    def get(self):
        now = datetime.now()
        hours = int(self.request.get("hours", "1"))
        timestamp = datetime(now.year, now.month, now.day, now.hour) - timedelta(hours=hours)
        tweets = Tweet.get_tweets_after(timestamp)
        self.response.headers['Content-Type'] = "application/json"
        self.response.out.write(Tweet.list_to_json(tweets))
