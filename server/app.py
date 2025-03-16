from datetime import timedelta

import firebase_admin
from firebase_admin import firestore, credentials, auth, storage
from flask_cors import CORS
from flask import Flask, request, jsonify
import tempfile
import subprocess

# Set up firestore database
cred = credentials.Certificate(r"key.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "cansat-education-tool.firebasestorage.app"
})

# Get the Firebase Storage bucket
bucket = storage.bucket()
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
        school_name = data["school_name"]
        school_id = data["school_id"]

        # Save user data in Firestore
        user_ref = db.collection("users").document(user_id)
        user_ref.set({
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "school_name": school_name,
            "school_id": school_id,
        })

        return jsonify({"message": "User registered successfully", "uid": user_id, "email": email, "name": name,
                        "role": role}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to handle user role checking
@app.route("/check-role", methods=["POST"])
def check_role():
    try:
        # Get the Firebase ID token from the request
        id_token = request.json.get("idToken")
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]

        # Fetch user role from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            return jsonify({"role": user_data.get("role")})
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 401


# API route to return a list of all users
@app.route("/users", methods=["GET"])
def get_users():
    try:
        users_ref = db.collection("users")
        users = users_ref.stream()
        user_list = [{"user_id": user.id, **user.to_dict()} for user in users]
        return jsonify(user_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to send user information edits by admin to the database
@app.route("/edit-user", methods=["POST"])
def edit_user():
    try:
        data = request.json
        user_id = data["user_id"]
        email = data["email"]
        name = data["name"]
        role = data["role"]

        # Update user data in Firestore
        user_ref = db.collection("users").document(user_id)
        user_ref.update({
            "email": email,
            "name": name,
            "role": role,
        })

        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to delete a user from the database
@app.route("/delete-user", methods=["POST"])
def delete_user():
    try:
        data = request.json
        user_id = data["user_id"]

        # Delete user data from Firestore
        user_ref = db.collection("users").document(user_id)
        user_ref.delete()

        # Delete user from Firebase Authentication
        auth.delete_user(user_id)

        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to create a new user in the database
@app.route("/create-user", methods=["POST"])
def create_user():
    try:
        data = request.json
        email = data["email"]
        password = data["password"]
        name = data["name"]
        role = data["role"]
        school_name = data["school_name"]
        school_id = data["school_id"]

        # Create user in Firebase Authentication
        user = auth.create_user(
            email=email,
            password=password
        )

        # Save user data in Firestore
        user_ref = db.collection("users").document(user.uid)
        user_ref.set({
            "user_id": user.uid,
            "email": email,
            "name": name,
            "role": role,
            "school_name": school_name,
            "school_id": school_id,
        })

        return jsonify({"message": "User created successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to get pdfs from the database
@app.route("/get-pdfs", methods=["GET"])
def get_pdfs():
    try:
        blobs = bucket.list_blobs(prefix="pdfs/")
        pdf_files = [blob for blob in blobs if blob.name.endswith(".pdf")]

        pdf_list = []
        for idx, blob in enumerate(pdf_files):
            url = blob.generate_signed_url(
                expiration=timedelta(hours=1),  # URL valid for 1 hour
                method="GET"
            )
            pdf_list.append({"id": str(idx + 1), "name": blob.name, "url": url})

        return jsonify(pdf_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to upload pdfs to the database
@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename.endswith(".pdf"):
            return jsonify({"error": "Only PDF files are allowed"}), 400

        # Keep the original filename
        filename = file.filename

        # Upload the file to Firebase Storage
        blob = bucket.blob(f"pdfs/{filename}")
        blob.upload_from_file(file, content_type="application/pdf")
        blob.make_public()  # Make the file publicly accessible

        return jsonify({"message": "File uploaded successfully", "name": filename, "url": blob.public_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to send the code to from student ide to the server
@app.route('/run', methods=['POST'])
def run_code():
    user_code = request.json.get("code", "")

    TEMPLATE = """
        #include <iostream>
        using namespace std;

        class serial {
            public:
                static void println(const string& msg) { cout << msg; }
                static void println(int num) { cout << num; }
                static void begin(int rate) { int baudRate = rate; }  // Simulated baud rate setup
        };

        void setup();
        void loop();

        serial Serial;  // Global serial object

        int main() {
            setup();
            for (int i = 0; i < 1; i++) loop();  // Simulate running loop()
            return 0;
        }

        {}

    """

    complete_code = TEMPLATE.replace("{}", user_code)  # Safe replacement

    with tempfile.NamedTemporaryFile(suffix=".cpp", delete=False) as temp:
        temp.write(complete_code.encode())
        temp.close()

        try:
            output = subprocess.check_output(
                ["g++", temp.name, "-o", "arduino_sim"]
            )
            result = subprocess.check_output(["./arduino_sim"]).decode()
            return jsonify({"output": result})
        except subprocess.CalledProcessError as e:
            return jsonify({"error": e.output.decode()})


# Run the Flask server
app.run(debug=True, port=8080)
