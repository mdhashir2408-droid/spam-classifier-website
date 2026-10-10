import os
import re
import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Resolve root directory whether invoked from root or api/ subdirectory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(CURRENT_DIR) == "api":
    ROOT_DIR = os.path.dirname(CURRENT_DIR)
else:
    ROOT_DIR = CURRENT_DIR

app = Flask(
    __name__,
    template_folder=os.path.join(ROOT_DIR, "templates"),
    static_folder=os.path.join(ROOT_DIR, "static")
)

# Note: On Vercel, requests are routed to api/index.py via rewrites, and Flask's WSGI receives the real request path.
# Overriding PATH_INFO with HTTP_X_MATCHED_PATH (/api/index.py) broke all API endpoints.

# Locate dataset reliably
CSV_PATH = os.path.join(ROOT_DIR, "msg.csv")
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.join(ROOT_DIR, "messages.csv")
if not os.path.exists(CSV_PATH):
    CSV_PATH = "msg.csv" if os.path.exists("msg.csv") else "messages.csv"

print(f"Loading dataset from: {CSV_PATH}")
data = pd.read_csv(CSV_PATH)

total_count = len(data)
spam_count = int((data["label"] == "spam").sum())
ham_count = int((data["label"] == "ham").sum())

vectorizer = CountVectorizer(stop_words=None)
X_vectorized = vectorizer.fit_transform(data["message"])
y = data["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X_vectorized, y, test_size=0.2, random_state=42
)

model = MultinomialNB()
model.fit(X_train, y_train)

# Calculate accuracy
predictions = model.predict(X_test)
accuracy = float(accuracy_score(y_test, predictions))

# Feature importances / trigger word mapping
ham_class_idx = list(model.classes_).index("ham")
spam_class_idx = list(model.classes_).index("spam")
ham_log_probs = model.feature_log_prob_[ham_class_idx]
spam_log_probs = model.feature_log_prob_[spam_class_idx]
vocab = vectorizer.vocabulary_

print(f"Model initialized! Samples: {total_count} (Spam: {spam_count}, Ham: {ham_count}) | Test Accuracy: {accuracy * 100:.1f}%")

@app.route("/")
@app.route("/api/index")
@app.route("/api/index.py")
def index():
    return render_template(
        "index.html", 
        total_samples=total_count, 
        spam_samples=spam_count, 
        ham_samples=ham_count, 
        accuracy=round(accuracy * 100, 1)
    )

@app.route("/api/stats", methods=["GET"])
@app.route("/stats", methods=["GET"])
def get_stats():
    return jsonify({
        "total_samples": total_count,
        "spam_samples": spam_count,
        "ham_samples": ham_count,
        "accuracy_pct": round(accuracy * 100, 1),
        "vocabulary_size": len(vocab)
    })

@app.route("/api/predict", methods=["GET", "POST"], strict_slashes=False)
@app.route("/predict", methods=["GET", "POST"], strict_slashes=False)
def predict():
    if request.method == "GET":
        return jsonify({
            "status": "online",
            "endpoint": "/api/predict",
            "method": "POST",
            "description": "Send a POST request with JSON payload: {\"message\": \"your text\"}"
        })

    try:
        body = request.get_json(force=True, silent=True) or {}
        message = body.get("message", "").strip()

        if not message:
            return jsonify({"error": "Please provide a valid message to evaluate."}), 400

        vec = vectorizer.transform([message])
        predicted_label = model.predict(vec)[0]
        probs = model.predict_proba(vec)[0]

        ham_prob = float(probs[ham_class_idx])
        spam_prob = float(probs[spam_class_idx])
        confidence = float(max(ham_prob, spam_prob) * 100)

        # Identify trigger keywords from the input message
        tokens = re.findall(r"\b\w+\b", message.lower())
        detected_spam_triggers = []
        detected_ham_indicators = []
        seen = set()

        for token in tokens:
            if token in vocab and token not in seen:
                seen.add(token)
                feat_idx = vocab[token]
                log_diff = spam_log_probs[feat_idx] - ham_log_probs[feat_idx]
                if log_diff > 0.4:
                    detected_spam_triggers.append(token)
                elif log_diff < -0.4:
                    detected_ham_indicators.append(token)

        return jsonify({
            "message": message,
            "label": predicted_label,
            "is_spam": predicted_label == "spam",
            "confidence": round(confidence, 1),
            "spam_probability": round(spam_prob * 100, 1),
            "ham_probability": round(ham_prob * 100, 1),
            "spam_triggers": detected_spam_triggers[:8],
            "ham_indicators": detected_ham_indicators[:8],
            "char_count": len(message),
            "word_count": len(tokens)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(400)
def handle_400(e):
    return jsonify({"error": "Bad request", "details": str(e)}), 400

@app.errorhandler(404)
def handle_404(e):
    if request.path.startswith("/api/") or request.path.startswith("/predict") or request.path.startswith("/stats"):
        return jsonify({"error": f"API endpoint not found: {request.path}"}), 404
    return render_template(
        "index.html", 
        total_samples=total_count, 
        spam_samples=spam_count, 
        ham_samples=ham_count, 
        accuracy=round(accuracy * 100, 1)
    ), 404

@app.errorhandler(405)
def handle_405(e):
    if request.path.startswith("/api/") or request.path.startswith("/predict") or request.path.startswith("/stats"):
        return jsonify({"error": f"Method {request.method} not allowed for {request.path}"}), 405
    return "Method Not Allowed", 405

@app.errorhandler(500)
def handle_500(e):
    if request.path.startswith("/api/") or request.path.startswith("/predict") or request.path.startswith("/stats"):
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
    return "Internal Server Error", 500

if __name__ == "__main__":
    print("\nStarting Spam Classifier Web Server at http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
