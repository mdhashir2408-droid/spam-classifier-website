from sklearn.metrics import accuracy_score
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from tkinter import *
import pandas as pd
import os



os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("\nLoading dataset...")
csv_path = "msg.csv" if os.path.exists("msg.csv") else "messages.csv"
data = pd.read_csv(csv_path)
print(f"  Total: {len(data)} | Spam: {len(data[data['label'] == 'spam'])} | Normal: {len(data[data['label'] == 'ham'])}")

X = data["message"]
y = data["label"]

vectorizer = CountVectorizer()
X_vectorized = vectorizer.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_vectorized, y, test_size=0.2, random_state=42
)

print("Training model...")
model = MultinomialNB()
model.fit(X_train, y_train)

accuracy = accuracy_score(y_test, model.predict(X_test))
print(f"Done! Accuracy: {accuracy * 100:.1f}%")

root = Tk()
root.title("Spam Message Classifier")
root.geometry("500x300")

title = Label(root, text="Spam Message Classifier",
              font=("Arial", 16, "bold"))
title.pack(pady=10)

Label(root, text="Enter Message:").pack()

message_entry = Entry(root, width=50)
message_entry.pack(pady=10)

result_label = Label(root, text="", font=("Arial", 12))
result_label.pack(pady=20)

def check_message():
    user_message = message_entry.get().strip()

    if user_message == "":
        result_label.config(text="Please enter a message.")
        return

    message_vector = vectorizer.transform([user_message])

    result = model.predict(message_vector)[0]

    confidence = max(
        model.predict_proba(message_vector)[0]
    ) * 100

    if result == "spam":
        result_label.config(
            text=f"SPAM! ({confidence:.1f}%)",
            fg="red"
        )
    else:
        result_label.config(
            text=f"Not Spam ({confidence:.1f}%)",
            fg="green"
        )

Button(root,
       text="Check Message",
       command=check_message).pack()

Label(root,
      text=f"Model Accuracy: {accuracy*100:.1f}%").pack(pady=10)

root.mainloop()