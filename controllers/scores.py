import webapp2
from models.dao.score import Score

class ScoresController(webapp2.RequestHandler):
    def get(self, symbol):
        number_of_scores = int(self.request.get('count', 24))
        scores = Score.get_last_scores(symbol, number_of_scores)
        self.response.headers['Content-Type'] = "application/json"
        self.response.out.write(Score.list_to_json(symbol, scores))
