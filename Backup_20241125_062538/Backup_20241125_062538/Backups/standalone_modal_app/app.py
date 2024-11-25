from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/engineering_modal')
def engineering_modal():
    return render_template('engineering_modal.html')

if __name__ == '__main__':
    app.run(debug=True)
