import dev
from django.utils import simplejson
from urlparse import urlparse
from gaesessions import get_current_session 
import string
import random
import sys, traceback
import cgi
import urllib
from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app 
from google.appengine.ext import db 
from google.appengine.ext.webapp import template 
import datetime
import logging
import os.path
import os

class BaseHandler(webapp.RequestHandler):
	@property
	def session(self):
		if not hasattr(self, "_session"):
			logging.debug('getting session')
			self._session = get_current_session()
                        if not self._session.has_key("fb"):
                            self._session["fb"] = {}

		return self._session

	def handle_exception(self, exception, mode):
		webapp.RequestHandler.handle_exception(self,exception, mode)
		logging.error("OOPS!: %s" % str(exception))
		self.response.out.write("OOPS!")

def create_fb_login_url(redirect_uri):
	return 'http://www.facebook.com/dialog/oauth/?' + urllib.urlencode({'client_id': dev.FACEBOOK_APP_ID, 'redirect_uri': redirect_uri, 'scope': dev.SCOPE})


class Main(BaseHandler):
            def get(self):
                self.response.headers['P3P'] = 'CP="OUR PSA CAO"'
                facebookext = 'facebookexternalhit' in self.request.headers['User-Agent']
        
		context = {'appid': dev.FACEBOOK_APP_ID,
                           'fbns' : dev.FACEBOOK_NAMESPACE,
			   'fburl': dev.FACEBOOK_APP_URL,
			   'sid': self.session["sid"],
                           'scope': dev.SCOPE,
                           'fb': simplejson.dumps(self.session["fb"]),
                           'server': dev.SERVER}

		path = os.path.join(os.path.dirname(__file__), 'index.html')
		self.response.out.write(template.render(path, {'context': simplejson.dumps(context)}))

class Auth(BaseHandler):
	def get(self):
		verification_code = self.request.get("code")
		access_token = self.request.get("access_token")                
		if verification_code:
			logging.debug('code %s', verification_code)
			args = dict(client_id=dev.FACEBOOK_APP_ID, redirect_uri=self.request.path_url)

			args["client_secret"] = dev.FACEBOOK_APP_SECRET
			args["code"] = self.request.get("code")
			response = cgi.parse_qs(urllib.urlopen(
					"https://graph.facebook.com/oauth/access_token?" +
					urllib.urlencode(args)).read())

			access_token = response["access_token"][-1]
			logging.debug('token %s', access_token)
                        profile = simplejson.load(urllib.urlopen(
                            "https://graph.facebook.com/me?" +
                            urllib.urlencode(dict(access_token=access_token))))

                        logging.debug('authing facebook user %s', profile)

                        self.session["fb"] = profile
                        self.session["access_token"] = access_token

                        logging.debug('authed facebook user')
                        self.redirect('/')
		else:
                        logging.debug('authing facebook user')
                        loginUrl = create_fb_login_url(self.request.path_url)
                        self.redirect(loginUrl)

application = webapp.WSGIApplication([('/auth', Auth),
                                      ('/.*', Main),]
                                     ,debug=True)

def main():
	logging.getLogger().setLevel(logging.DEBUG)
	run_wsgi_app(application)
	
if __name__ == "__main__":
	main()
