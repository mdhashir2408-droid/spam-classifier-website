import os
import re
import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

CSV_PATH = os.path.join(BASE_DIR, "msg.csv")
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.join(BASE_DIR, "messages.csv")
if not os.path.exists(CSV_PATH):
    CSV_PATH = "msg.csv" if os.path.exists("msg.csv") else "messages.csv"

# Load dataset and train model
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
# model.classes_ -> ['ham', 'spam']
ham_class_idx = list(model.classes_).index("ham")
spam_class_idx = list(model.classes_).index("spam")
ham_log_probs = model.feature_log_prob_[ham_class_idx]
spam_log_probs = model.feature_log_prob_[spam_class_idx]
vocab = vectorizer.vocabulary_

print(f"Model initialized! Samples: {total_count} (Spam: {spam_count}, Ham: {ham_count}) | Test Accuracy: {accuracy * 100:.1f}%")

@app.route("/")
def index():
    return render_template("index.html", 
                           total_samples=total_count, 
                           spam_samples=spam_count, 
                           ham_samples=ham_count, 
                           accuracy=round(accuracy * 100, 1))

@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify({
        "total_samples": total_count,
        "spam_samples": spam_count,
        "ham_samples": ham_count,
        "accuracy_pct": round(accuracy * 100, 1),
        "vocabulary_size": len(vocab)
    })

@app.route("/api/predict", methods=["POST"])
def predict():
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
        # Tokenize by alphanumeric words
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

if __name__ == "__main__":
    print("\nStarting Spam Classifier Web Server at http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
