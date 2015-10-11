import webapp2
import controllers.spa
import controllers.scores
import controllers.poll

app = webapp2.WSGIApplication([
    ('/', controllers.spa.SpaController),
    ('/spa/?', controllers.spa.SpaController),
    ('/scores/(?P<symbol>[-\w]+)/?', controllers.scores.ScoresController),
    ('/poll/?', controllers.poll.PollController)
], debug=True)
