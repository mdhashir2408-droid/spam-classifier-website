# SpamGuard AI — Intelligent Message Spam Classifier

A modern, high-performance web application and machine learning model that classifies text messages and emails as **Spam** or **Legitimate (Ham)** in real time with high accuracy and explainability.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)
![Flask](https://img.shields.io/badge/Framework-Flask-black.svg)
![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-orange.svg)
![Deployment](https://img.shields.io/badge/Deployment-Vercel-black.svg)

---

## 🌟 Key Features

- **High-Accuracy ML Pipeline**: Trained on SMS and email datasets using `CountVectorizer` and `MultinomialNB`.
- **Explainable AI (XAI)**: Identifies and highlights specific trigger words and influence tokens that caused the classification.
- **Glassmorphic Cyber UI**: Sleek dark-mode aesthetic with interactive 3D particle constellation background and 3D card tilt.
- **Instant 1-Click Samples**: Preset test cases for phishing alerts, lottery scams, and authentic messages.
- **Zero-Latency In-Memory Inference**: Real-time predictions in under 5ms.
- **Vercel Serverless Ready**: Configured for instant deployment to Vercel with zero cold-start bottlenecks.

---

## 🚀 Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/spam-classifier-website.git
   cd spam-classifier-website
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the web application:**
   ```bash
   python app.py
   ```

4. **Open in your browser:**
   ```
   http://127.0.0.1:5000
   ```

---

## 🌐 Deploying to Vercel

### Option 1: Vercel Web Dashboard (Recommended)
1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New"** > **"Project"**.
4. Import your `spam-classifier-website` repository from GitHub.
5. Click **"Deploy"**. Vercel will automatically detect `requirements.txt` and `vercel.json` and deploy your app.

### Option 2: Vercel CLI
```bash
npx vercel
```

---

## 📁 Project Structure

```
├── api/
│   └── index.py            # Vercel serverless function entry point
├── static/
│   ├── app.js              # 3D canvas mesh, 3D tilt, and dynamic client logic
│   └── style.css           # Premium responsive glassmorphic styles
├── templates/
│   └── index.html          # Semantic HTML5 dashboard
├── app.py                  # Core Flask server and ML inference logic
├── main.py                 # Desktop Tkinter GUI implementation
├── msg.csv                 # Spam & Ham training dataset
├── requirements.txt        # Python dependency manifest
├── vercel.json             # Vercel serverless routing configuration
└── README.md               # Project documentation
```

---

## 🛠️ API Reference

### `POST /api/predict`
Evaluates a message and returns the classification result.

**Request Body:**
```json
{
  "message": "Win a free iPhone now! Click here!!"
}
```

**Response:**
```json
{
  "is_spam": true,
  "label": "spam",
  "confidence": 99.3,
  "spam_probability": 99.3,
  "ham_probability": 0.7,
  "spam_triggers": ["win", "free", "iphone", "click"],
  "ham_indicators": [],
  "char_count": 36,
  "word_count": 7
}
```
