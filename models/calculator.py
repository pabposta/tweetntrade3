import re

class Calculator(object):
    buy_words = set(('buy', 'long', 'kaufen', 'kauf', 'comprar', 'compra'))
    sell_words = set(('sell', 'short', 'verkaufen', 'verkauf', 'vender', 'venta'))

    def __init__(self):
        self.buys = 0
        self.sells = 0
        self.volume = 0
        self.score = 0.0

    def add_tweet(self, tweet):
        buy_or_sell = False
        words = set(word.lower() for word in re.findall(r"\w+", tweet.text))
        if words.intersection(self.buy_words):
            self.buys += 1
            buy_or_sell = True
        if words.intersection(self.sell_words):
            self.sells += 1
            buy_or_sell = True
        if buy_or_sell:
            self.volume += 1

    def calculate_score(self):
        """ Calculate the score after all tweets have been added """
        if self.buys or self.sells:
            self.score = (self.buys - self.sells) / float(self.buys + self.sells)
