import BaseHTTPServer
import mimetypes

from SimpleHTTPServer import SimpleHTTPRequestHandler


class Webapp(SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith('.webapp'):
            return 'application/x-web-app-manifest+json'
        return SimpleHTTPRequestHandler.guess_type(self, path)


def test(HandlerClass = Webapp,
         ServerClass = BaseHTTPServer.HTTPServer):
    BaseHTTPServer.test(HandlerClass, ServerClass)

if __name__=='__main__':
    test()
