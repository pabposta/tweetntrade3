import webapp2
import controllers.spa
import controllers.tweets
import controllers.poll

app = webapp2.WSGIApplication([
    ('/', controllers.spa.SpaController),
    ('/spa/?', controllers.spa.SpaController),
    ('/tweets/?', controllers.tweets.TweetsController),
    ('/poll/?', controllers.poll.PollController)
], debug=True)
