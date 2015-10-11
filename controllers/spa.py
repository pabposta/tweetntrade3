import webapp2
import config

class SpaController(webapp2.RequestHandler):
    def get(self):
        template = config.JINJA_ENVIRONMENT.get_template('views/spa.html')
        self.response.out.write(template.render())
