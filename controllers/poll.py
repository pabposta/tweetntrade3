import webapp2
from models.time import Time
from models.calculator import Calculator
from models.dao.score import Score
from models.poller import Poller

class PollController(webapp2.RequestHandler):
    symbol = 'EURUSD'
    default_interval = 30*60

    def get(self):
        # do not run on weekends and in the future holidays. app engine's cron does not allow to specify this
        if Time.today_is_holiday():
            return
        interval = int(self.request.get('interval', self.default_interval))
        timestamp = Time.current_time()
        poller = Poller(interval)
        calculator = Calculator()
        # search all tweets and collect them in the calculator
        poller.search(calculator)
        # once we are done collecting all tweets, calculate the final score
        calculator.calculate_score()
        Score.insert(self.symbol, timestamp, calculator.score, calculator.volume)
