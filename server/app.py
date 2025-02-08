import firebase_admin
from firebase_admin import firestore, credentials, auth
from flask_cors import CORS
from flask import Flask, request, jsonify


# Set up firestore database
cred = credentials.Certificate('key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Create the Flask app
app = Flask(__name__)
CORS(app)


# api route to handle registering
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        user_id = data["user_id"]
        email = data["email"]
        name = data["name"]
        role = data["role"]

        # Save user data in Firestore
        user_ref = db.collection("users").document(user_id)
        user_ref.set({
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": role,
        })

        return jsonify({"message": "User registered successfully", "uid": user_id, "email": email, "name": name,
                        "role": role}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Run the Flask server
app.run(debug=True, port=8080)
