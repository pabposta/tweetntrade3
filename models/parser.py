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
            tp_found = re.findall(r"TP {}".format(self.digit_re.pattern), text)
            if len(tp_found) == 1:
                tp = float(re.search(self.digit_re, tp_found[0]).group(0))
                if tp != 0.0:
                    sl_found = re.findall(r"SL {}".format(self.digit_re.pattern), text)
                    if len(sl_found) == 1:
                        sl = float(re.search(self.digit_re, sl_found[0]).group(0))
                        if sl != 0.0:
                            # we can clearly assign one symbol to one stop and one target, so do it
                            # extract sl and tp from text. we can do this safely, as we know we can extract a float
                            symbol = list(symbols_found)[0]
                            timestamp = tweet.created_at
                            tweet_id = tweet.id_str
                            tweet_model = Tweet(id=tweet_id, symbol=symbol, timestamp=timestamp, stop=sl, target=tp)
                            return tweet_model
        return None
