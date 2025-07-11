from flask import Flask, request, jsonify, render_template_string
import subprocess
import sys
import html
import os

app = Flask(__name__)

with open("templates/template.html", 'r', encoding="utf-8") as f:
    HTML_TEMPLATE = f.read()

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/execute', methods=['POST'])
def execute():
    data = request.json
    code = data.get('code', '')

    try:
        process = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=10,
            check=True
        )

        return jsonify({
            'output': html.unescape(process.stdout)
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            'error': html.unescape(f"Error [{e.returncode}]:\n{e.stderr}")
        })
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout: Execution exceeded 10 seconds'})
    except Exception as e:
        return jsonify({'error': html.escape(str(e))})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)