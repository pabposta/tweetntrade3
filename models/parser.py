import re
from models.dao.tweet import Tweet

class Parser(object):
    symbols = {'AUDUSD', 'EURAUD', 'EURCAD', 'EURCHF', 'EURUSD', 'GBPUSD', 'NZDCAD', 'NZDJPY', 'NZDUSD', 'USDCAD',
               'USDJPY'}

    def __init__(self):
        self.digit_re = re.compile(r"\d*\.?\d+")

    def parse_tweet(self, tweet):
        text = re.sub('[^\w\.\d]+', ' ', tweet.text)
        text = text.upper()
        words = set(text.split())
        symbols_found = self.symbols & words
        if len(symbols_found) == 1:
            sl_found = re.findall(r"SL {}".format(self.digit_re.pattern), text)
            if len(sl_found) == 1 and sl_found[0] != 0.0:
                tp_found = re.findall(r"TP {}".format(self.digit_re.pattern), text)
                if len(tp_found) == 1 and tp_found[0] != 0.0:
                    # we can clearly assign one symbol to one stop and one target, so do it
                    # extract sl and tp from text. we can do this safely, as we know we can extract a float
                    sl = float(re.search(self.digit_re, sl_found[0]).group(0))
                    tp = float(re.search(self.digit_re, tp_found[0]).group(0))
                    symbol = list(symbols_found)[0]
                    timestamp = tweet.created_at
                    tweet_id = tweet.id_str
                    tweet_model = Tweet(id=tweet_id, symbol=symbol, timestamp=timestamp, stop=sl, target=tp)
                    return tweet_model
        return None
