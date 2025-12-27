from flask import jsonify, render_template_string, request


def register_error_handlers(app):
    """Register error handlers for the Flask app with Memegen integration"""

    @app.errorhandler(404)
    def not_found(error):
        return _respond('Resource not found', 'confused-travolta', '404', 'Where-is-the-page', 404)

    @app.errorhandler(400)
    def bad_request(error):
        return _respond('Bad request', 'grumpycat', '400', 'Bad-Request-No', 400)

    @app.errorhandler(500)
    def internal_error(error):
        return _respond('Internal server error', 'fine', '500', 'Everything-is-fine', 500, fmt='gif')

    @app.errorhandler(418)
    def im_a_teapot(error):
        return _respond('I\'m a teapot', 'kermit', '418', 'I\'m-a-teapot', 418)

    @app.errorhandler(TypeError)
    @app.errorhandler(ValueError)
    def handle_validation_error(error):
        return _respond(str(error), 'doge', 'wow-error', 'much-invalid-data', 400)


    # Helpers
    def _respond(error_message, template, top, bottom, status, fmt='png'):
        url = generate_meme_url(template, top, bottom, format=fmt)
        # Prefer JSON when client accepts JSON at least as much as HTML
        if request.accept_mimetypes['application/json'] >= request.accept_mimetypes['text/html']:
            return jsonify({'error': error_message, 'meme': url}), status
        # Otherwise render only the image element
        return render_template_string('<img src="{{ url }}" alt="meme" style="display:block; margin:auto;"><style>body{background:#000;}</style>', url=url), status

    def generate_meme_url(template, top, bottom, format='png'):
        """Generate a Memegen URL with given template, top text, bottom text, and format (default: png)"""
        top, bottom = top.replace(" ", "-"), bottom.replace(" ", "-")
        return f"https://api.memegen.link/images/{template}/{top}/{bottom}.{format}"
