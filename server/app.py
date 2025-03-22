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

bucket = storage.bucket()
db = firestore.client()

app = Flask(__name__)
CORS(app)

# API route to handle registering
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

        # Check Firebase Authentication for email verification status
        user = auth.get_user(user_id)
        verified = user.email_verified  # Get verification status from Firebase Auth

        # Save user data in Firestore with verification status
        user_ref = db.collection("users").document(user_id)
        user_ref.set({
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "school_name": school_name,
            "school_id": school_id,
            "verified": verified  # Add verification status
        })

        return jsonify({
            "message": "User registered successfully. Please check your email to verify your account.",
            "uid": user_id,
            "email": email,
            "name": name,
            "role": role,
            "verified": verified
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API route to handle user role checking
@app.route("/check-role", methods=["POST"])
def check_role():
    try:
        id_token = request.json.get("idToken")
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]

        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            return jsonify({"role": user_data.get("role"), "verified": user_data.get("verified")})
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

        user_ref = db.collection("users").document(user_id)
        user_ref.delete()
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

        user = auth.create_user(email=email, password=password)
        user_ref = db.collection("users").document(user.uid)
        user_ref.set({
            "user_id": user.uid,
            "email": email,
            "name": name,
            "role": role,
            "school_name": school_name,
            "school_id": school_id,
            "verified": False  # Initially unverified
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
            url = blob.generate_signed_url(expiration=timedelta(hours=1), method="GET")
            size_mb = round(blob.size / (1024 * 1024), 2)
            last_modified = blob.updated

            pdf_list.append({
                "id": str(idx + 1),
                "name": blob.name,
                "url": url,
                "size_mb": size_mb,
                "last_modified": last_modified if last_modified else None
            })

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

        filename = file.filename
        blob = bucket.blob(f"pdfs/{filename}")
        blob.upload_from_file(file, content_type="application/pdf")
        blob.make_public()

        return jsonify({"message": "File uploaded successfully", "name": filename, "url": blob.public_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to delete a pdf from Firebase Storage
@app.route("/delete-pdf", methods=["POST"])
def delete_pdf():
    try:
        file_name = request.json.get("file_name")
        if not file_name:
            return jsonify({"error": "File name is required"}), 400

        blob = bucket.blob(file_name)
        if not blob.exists():
            return jsonify({"error": "File not found"}), 404

        blob.delete()
        return jsonify({"message": f"Successfully deleted {file_name}"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to send student progress to the database
@app.route('/mark-progress', methods=['POST'])
def mark_progress():
    try:
        data = request.json
        user_id = data.get('user_id')
        material_id = data.get('material_id')
        title = data.get('title')
        type = data.get('type')
        completed = data.get('completed')
        completion_date = data.get('completion_date')
        accessed_at = data.get('accessed_at')

        if not all([user_id, material_id, title, accessed_at]):
            return jsonify({"error": "Missing required fields"}), 400

        progress_ref = db.collection('progress').document(user_id)
        progress_doc = progress_ref.get()

        if progress_doc.exists:
            progress_data = progress_doc.to_dict()
            items = progress_data.get('items', [])
        else:
            items = []

        # Update or add the progress record
        found = False
        for item in items:
            if item["material_id"] == material_id:
                item["completed"] = completed
                item["completion_date"] = completion_date
                found = True
                break

        if not found:
            items.append({
                "material_id": material_id,
                "type": type,
                "title": title,
                "accessed_at": accessed_at,
                "completed": completed,
                "completion_date": completion_date,
            })

        # Save back to Firestore
        progress_ref.set({"user_id": user_id, "items": items})

        return jsonify({"message": "Progress updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to get student progress from the database
@app.route('/get-user-progress', methods=['GET'])
def get_user_progress():
    try:
        user_id = request.args.get('user_id')
        progress_type = request.args.get('type')
        if not user_id or not progress_type:
            return jsonify({"error": "Missing required parameters"}), 400

        # Fetch the user document from Firestore
        progress_ref = db.collection('progress').document(user_id)
        progress_doc = progress_ref.get()

        # Extract progress items if the document exists
        if progress_doc.exists:
            progress_data = progress_doc.to_dict()
            items = progress_data.get('items', [])

            # Filter the progress by type (e.g., "training_material")
            filtered_items = [item for item in items if item.get('type') == progress_type]
        else:
            filtered_items = []

        return jsonify(filtered_items), 200  # Returning the filtered list directly

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to get the instructor's student progress from the db
@app.route('/student-progress', methods=['GET'])
def get_student_progress():
    try:
        instructor_id = request.args.get("user_id")  # Instructor's user_id

        if not instructor_id:
            return jsonify({"error": "Missing user_id parameter"}), 400

        # Fetch instructor's school_id
        instructor_doc = db.collection("users").document(instructor_id).get()
        if not instructor_doc.exists:
            return jsonify({"error": "Instructor not found"}), 404

        instructor_data = instructor_doc.to_dict()
        instructor_school_id = instructor_data.get("school_id")

        if not instructor_school_id:
            return jsonify({"error": "Instructor does not have a school_id"}), 400

        # Fetch all students in the same school
        students_query = db.collection("users").where("school_id", "==", instructor_school_id).where("role", "==",
                                                                                                     "student")
        students_docs = students_query.stream()

        student_ids = [doc.id for doc in students_docs]

        if not student_ids:
            return jsonify({"message": "No students found for this school"}), 200

        # Fetch progress data for all students in this school
        progress_query = db.collection("progress").where("user_id", "in", student_ids)
        progress_docs = progress_query.stream()

        progress_data = []
        for doc in progress_docs:
            progress_entry = doc.to_dict()
            progress_entry["id"] = doc.id  # Include document ID
            progress_data.append(progress_entry)

        return jsonify(progress_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to get the user data by id
@app.route("/users/<user_id>", methods=["GET"])
def get_user(user_id):
    try:
        users_collection = db.collection("users")
        user_doc = users_collection.document(user_id).get()
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404

        user_data = user_doc.to_dict()
        return jsonify({
            "user_id": user_id,
            "name": user_data.get("name", "Unknown"),
            "email": user_data.get("email", "No email provided"),
        }), 200

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
                static void begin(int rate) { int baudRate = rate; }
        };

        void setup();
        void loop();

        serial Serial;

        int main() {
            setup();
            for (int i = 0; i < 1; i++) loop();
            return 0;
        }

        {}
    """
    complete_code = TEMPLATE.replace("{}", user_code)

    with tempfile.NamedTemporaryFile(suffix=".cpp", delete=False) as temp:
        temp.write(complete_code.encode())
        temp.close()

        try:
            subprocess.check_output(["g++", temp.name, "-o", "arduino_sim"])
            result = subprocess.check_output(["./arduino_sim"]).decode()
            return jsonify({"output": result})
        except subprocess.CalledProcessError as e:
            return jsonify({"error": e.output.decode()})

if __name__ == "__main__":
    app.run(debug=True, port=8080)