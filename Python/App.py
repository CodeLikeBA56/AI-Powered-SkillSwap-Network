from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import re

app = Flask(__name__)

model = SentenceTransformer('all-MiniLM-L6-v2')

def clean(text):
    return re.sub(r'[^a-z0-9 ]+', '', text.lower())

@app.route('/recommend-users', methods=['POST'])
def recommend_users_for_session():
    data = request.json
    title = data.get("title", "")
    description = data.get("description", "")
    hashtags = data.get("hashtags", [])
    users = data.get("users", [])

    # Combine and clean session text
    session_text = clean(title + " " + description + " " + " ".join(hashtags))
    session_vec = model.encode([session_text])

    # Prepare users' interest text
    user_ids = []
    user_interest_texts = []

    for user in users:
        user_ids.append(user["_id"])
        interests_combined = " ".join(user.get("desiredSkills", []))
        user_interest_texts.append(clean(interests_combined))

    # Encode all users’ interest vectors
    user_vectors = model.encode(user_interest_texts)

    # Compute cosine similarities
    scores = cosine_similarity(session_vec, user_vectors).flatten()

    threshold = 0.1 # Choose a similarity threshold (tune this if needed)
    recommended_user_ids = [user_ids[i] for i, score in enumerate(scores) if score >= threshold]

    return jsonify({ "recommendedUserIds": recommended_user_ids })

if __name__ == '__main__':
    app.run(port=5002, debug=True)
    print(f"🚀 Server is running on PORT: 5002")
