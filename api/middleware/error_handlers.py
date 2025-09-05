from flask import jsonify

def register_error_handlers(app):
    """Register error handlers for the Flask app"""

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(TypeError)
    def handle_type_error(error):
        return jsonify({'error': 'Invalid data type provided'}), 400

    @app.errorhandler(ValueError)
    def handle_value_error(error):
        return jsonify({'error': 'Invalid value provided'}), 400
