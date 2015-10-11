import calendar
from google.appengine.ext import ndb

class Score(ndb.Model):
    symbol = ndb.StringProperty(required=True)
    timestamp = ndb.DateTimeProperty(required=True)
    score = ndb.FloatProperty(required=True, indexed=False)
    volume = ndb.IntegerProperty(required=True, indexed=False)

    @staticmethod
    def make_id(symbol, timestamp):
        return "{}_{}".format(symbol, timestamp)

    @classmethod
    def insert(cls, symbol, timestamp, score, volume):
        score = cls(id=cls.make_id(symbol, timestamp), symbol=symbol, timestamp=timestamp, score=score, volume=volume)
        score.put()

    @classmethod
    def get_last_scores(cls, symbol, num_scores=20):
        scores = cls.query(cls.symbol == symbol).order(-cls.timestamp).fetch(num_scores)
        return scores

    def to_json(self):
        unix_timestamp = calendar.timegm(self.timestamp.timetuple())
        as_json = '{{"timestamp":{},"score":{},"volume":{}}}'.format(unix_timestamp, self.score, self.volume)
        return as_json

    @staticmethod
    def list_to_json(symbol, scores):
        as_json = '{{"symbol":"{}","scores":[{}]}}'.format(symbol, ','.join(score.to_json() for score in scores))
        return as_json